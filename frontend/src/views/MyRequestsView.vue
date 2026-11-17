<script setup lang="ts">
import { useAbility } from '@casl/vue';
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  canVacationRequestBeChanged,
  vacationRequestStatusValues,
  vacationRequestSubject,
  type AppAbility,
  type VacationRequestDto,
  type VacationRequestStatus,
} from '@vacation-manager/shared';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import DataState from '../components/DataState.vue';
import PageHeading from '../components/PageHeading.vue';
import PaginationControls from '../components/PaginationControls.vue';
import VacationRequestForm from '../components/VacationRequestForm.vue';
import VacationRequestList from '../components/VacationRequestList.vue';
import { readApiError } from '../services/errorService';
import { formatDateRange, statusLabels } from '../services/presentationService';
import { readQueryPage, readQueryText, withoutEmptyValues } from '../services/routeQueryService';
import { useAppStore } from '../store';

const FORM_HEADING_ID = 'vacation-form-heading';
const LIST_HEADING_ID = 'my-requests-heading';

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const ability = useAbility<AppAbility>();

const editedRequest = ref<VacationRequestDto | null>(null);
const requestToCancel = ref<VacationRequestDto | null>(null);
const isCancelling = ref(false);

const requestPage = computed(() => store.state.myRequests.requestPage);
const isLoading = computed(() => store.state.myRequests.isLoading);
const errorMessage = computed(() => store.state.myRequests.errorMessage);

const statusFilter = computed<VacationRequestStatus | undefined>(() => {
  const statusText = readQueryText(route.query, 'status');
  return vacationRequestStatusValues.find((status) => status === statusText);
});
const pageNumber = computed(() => readQueryPage(route.query));

function loadRequests(): void {
  void store.dispatch('myRequests/load', { status: statusFilter.value, page: pageNumber.value });
}

watch([statusFilter, pageNumber], loadRequests, { immediate: true });

watch(requestPage, (loadedPage) => {
  if (loadedPage && loadedPage.items.length === 0 && loadedPage.page > loadedPage.totalPages) {
    changePage(loadedPage.totalPages);
  }
});

function changeStatusFilter(changeEvent: Event): void {
  const selectedStatus = (changeEvent.target as HTMLSelectElement).value;
  void router.replace({ query: withoutEmptyValues({ status: selectedStatus }) });
}

function changePage(pageNumber: number): void {
  void router.push({ query: withoutEmptyValues({ status: statusFilter.value, page: pageNumber }) });
}

function canChange(vacationRequest: VacationRequestDto): boolean {
  return (
    canVacationRequestBeChanged(vacationRequest.status) &&
    ability.can('update', vacationRequestSubject(vacationRequest.userId))
  );
}

async function startEditing(vacationRequest: VacationRequestDto): Promise<void> {
  editedRequest.value = vacationRequest;
  await nextTick();
  document.getElementById('start-date')?.focus();
}

async function confirmCancellation(): Promise<void> {
  const vacationRequest = requestToCancel.value;
  if (!vacationRequest) {
    return;
  }
  isCancelling.value = true;
  try {
    await store.dispatch('myRequests/cancel', vacationRequest.id);
    await store.dispatch('notifications/notifySuccess', 'Your request is cancelled.');
    if (editedRequest.value?.id === vacationRequest.id) {
      editedRequest.value = null;
    }
  } catch (error) {
    await store.dispatch('notifications/notifyError', readApiError(error).message);
    await store.dispatch('myRequests/reload');
  } finally {
    isCancelling.value = false;
    requestToCancel.value = null;
  }
}
</script>

<template>
  <PageHeading lead="Ask for days off, see where each request stands, and check who else is away.">
    Your time off, <em>all in one place.</em>
  </PageHeading>

  <div class="mt-9 grid gap-x-7 gap-y-4 lg:grid-cols-[22.5rem_1fr]">
    <h2 :id="FORM_HEADING_ID" class="section-title self-end lg:col-start-1 lg:row-start-1">
      {{ editedRequest ? 'Edit your request' : 'Request a vacation' }}
    </h2>

    <VacationRequestForm
      class="self-start lg:col-start-1 lg:row-start-2"
      :edited-request="editedRequest"
      :labelled-by="FORM_HEADING_ID"
      @finished="editedRequest = null"
    />

    <div
      class="mt-6 flex flex-wrap items-end justify-between gap-3 lg:col-start-2 lg:row-start-1 lg:mt-0"
    >
      <h2 :id="LIST_HEADING_ID" class="section-title">Submitted requests</h2>
      <div class="w-full sm:w-48">
        <label for="status-filter" class="mb-1 block text-sm font-semibold">Show</label>
        <select
          id="status-filter"
          class="field-input"
          :value="statusFilter ?? ''"
          @change="changeStatusFilter"
        >
          <option value="">All statuses</option>
          <option v-for="status in vacationRequestStatusValues" :key="status" :value="status">
            {{ statusLabels[status] }}
          </option>
        </select>
      </div>
    </div>

    <section
      :aria-labelledby="LIST_HEADING_ID"
      :aria-busy="isLoading"
      class="min-w-0 lg:col-start-2 lg:row-start-2"
    >
      <DataState
        :is-loading="isLoading && !requestPage"
        :error-message="errorMessage"
        :is-empty="requestPage?.items.length === 0"
        loading-label="Loading your requests"
        @retry="loadRequests"
      >
        <template #empty>
          <p v-if="statusFilter">
            You have no {{ statusLabels[statusFilter].toLowerCase() }} requests. Choose another
            status to see the rest.
          </p>
          <p v-else>
            You have not requested any vacation yet. Fill in the form to send your first request.
          </p>
        </template>

        <template v-if="requestPage">
          <VacationRequestList
            :vacation-requests="requestPage.items"
            :shows-requester="false"
            label="Your vacation requests"
          >
            <template #actions="{ vacationRequest }">
              <template v-if="canChange(vacationRequest)">
                <button type="button" class="button" @click="startEditing(vacationRequest)">
                  Edit
                </button>
                <button
                  type="button"
                  class="button button-danger-outline"
                  @click="requestToCancel = vacationRequest"
                >
                  Cancel request
                </button>
              </template>
            </template>
          </VacationRequestList>

          <PaginationControls
            :page="requestPage.page"
            :page-size="requestPage.pageSize"
            :total-items="requestPage.totalItems"
            :total-pages="requestPage.totalPages"
            @change-page="changePage"
          />
        </template>
      </DataState>
    </section>
  </div>

  <ConfirmDialog
    :is-open="requestToCancel !== null"
    title="Cancel this request?"
    :message="
      requestToCancel
        ? `Your request for ${formatDateRange(requestToCancel.startDate, requestToCancel.endDate)} will be removed.`
        : ''
    "
    confirm-label="Cancel request"
    cancel-label="Keep request"
    is-dangerous
    :is-busy="isCancelling"
    @confirm="confirmCancellation"
    @cancel="requestToCancel = null"
  />
</template>
