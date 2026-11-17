<script setup lang="ts">
import { useAbility } from '@casl/vue';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  canVacationRequestBeChanged,
  VacationRequestStatus,
  vacationRequestStatusValues,
  type AppAbility,
  type VacationRequestDto,
} from '@vacation-manager/shared';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import DataState from '../components/DataState.vue';
import PageHeading from '../components/PageHeading.vue';
import PaginationControls from '../components/PaginationControls.vue';
import RejectRequestDialog from '../components/RejectRequestDialog.vue';
import VacationRequestList from '../components/VacationRequestList.vue';
import { readApiError } from '../services/errorService';
import {
  formatDateRange,
  formatVacationLength,
  statusLabels,
} from '../services/presentationService';
import {
  readQueryPage,
  readQueryPositiveInteger,
  readQueryText,
  withoutEmptyValues,
} from '../services/routeQueryService';
import { useAppStore } from '../store';

const ALL_STATUSES = 'ALL';

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const ability = useAbility<AppAbility>();

const requestToApprove = ref<VacationRequestDto | null>(null);
const requestToReject = ref<VacationRequestDto | null>(null);
const isDeciding = ref(false);
const rejectionErrorMessage = ref<string | null>(null);

const requestPage = computed(() => store.state.reviewQueue.page);
const requesters = computed(() => store.state.reviewQueue.requesters);
const isLoading = computed(() => store.state.reviewQueue.isLoading);
const errorMessage = computed(() => store.state.reviewQueue.errorMessage);

const statusSelection = computed(() => {
  const statusText = readQueryText(route.query, 'status');
  if (statusText === ALL_STATUSES) {
    return ALL_STATUSES;
  }
  return (
    vacationRequestStatusValues.find((status) => status === statusText) ??
    VacationRequestStatus.Pending
  );
});
const statusFilter = computed(() =>
  statusSelection.value === ALL_STATUSES ? undefined : statusSelection.value,
);
const requesterFilter = computed(() => readQueryPositiveInteger(route.query, 'userId'));
const pageNumber = computed(() => readQueryPage(route.query));
const hasFilters = computed(
  () => statusFilter.value !== undefined || requesterFilter.value !== undefined,
);

function loadRequests(): void {
  void store.dispatch('reviewQueue/load', {
    status: statusFilter.value,
    userId: requesterFilter.value,
    page: pageNumber.value,
  });
}

watch([statusFilter, requesterFilter, pageNumber], loadRequests, { immediate: true });

watch(requestPage, (loadedPage) => {
  if (loadedPage && loadedPage.items.length === 0 && loadedPage.page > loadedPage.totalPages) {
    changePage(loadedPage.totalPages);
  }
});

store.dispatch('reviewQueue/loadRequesters').catch((error: unknown) => {
  void store.dispatch('notifications/notifyError', readApiError(error).message);
});

function changeFilters(status: string, userId: string): void {
  void router.replace({ query: withoutEmptyValues({ status, userId }) });
}

function changeStatusFilter(changeEvent: Event): void {
  const selectedStatus = (changeEvent.target as HTMLSelectElement).value;
  changeFilters(selectedStatus, String(requesterFilter.value ?? ''));
}

function changeRequesterFilter(changeEvent: Event): void {
  const selectedUserId = (changeEvent.target as HTMLSelectElement).value;
  changeFilters(statusSelection.value, selectedUserId);
}

function changePage(page: number): void {
  void router.push({
    query: withoutEmptyValues({
      status: statusSelection.value,
      userId: requesterFilter.value,
      page,
    }),
  });
}

function canDecide(vacationRequest: VacationRequestDto): boolean {
  return (
    canVacationRequestBeChanged(vacationRequest.status) &&
    ability.can('approve', 'VacationRequest') &&
    ability.can('reject', 'VacationRequest')
  );
}

function describeRequest(vacationRequest: VacationRequestDto): string {
  const dates = formatDateRange(vacationRequest.startDate, vacationRequest.endDate);
  const length = formatVacationLength(vacationRequest.startDate, vacationRequest.endDate);
  return `${vacationRequest.userName}, ${dates} (${length})`;
}

async function confirmApproval(): Promise<void> {
  const vacationRequest = requestToApprove.value;
  if (!vacationRequest) {
    return;
  }
  isDeciding.value = true;
  try {
    await store.dispatch('reviewQueue/approve', vacationRequest.id);
    await store.dispatch(
      'notifications/notifySuccess',
      `The request of ${vacationRequest.userName} is approved.`,
    );
  } catch (error) {
    await store.dispatch('notifications/notifyError', readApiError(error).message);
    await store.dispatch('reviewQueue/reload');
  } finally {
    isDeciding.value = false;
    requestToApprove.value = null;
  }
}

function openRejection(vacationRequest: VacationRequestDto): void {
  rejectionErrorMessage.value = null;
  requestToReject.value = vacationRequest;
}

async function confirmRejection(comment: string): Promise<void> {
  const vacationRequest = requestToReject.value;
  if (!vacationRequest) {
    return;
  }
  isDeciding.value = true;
  rejectionErrorMessage.value = null;
  try {
    await store.dispatch('reviewQueue/reject', { vacationRequestId: vacationRequest.id, comment });
    await store.dispatch(
      'notifications/notifySuccess',
      `The request of ${vacationRequest.userName} is rejected.`,
    );
    requestToReject.value = null;
  } catch (error) {
    const readableError = readApiError(error);
    if (readableError.fields.comment) {
      rejectionErrorMessage.value = readableError.fields.comment;
    } else {
      await store.dispatch('notifications/notifyError', readableError.message);
      await store.dispatch('reviewQueue/reload');
      requestToReject.value = null;
    }
  } finally {
    isDeciding.value = false;
  }
}
</script>

<template>
  <PageHeading
    lead="Approve or reject each request. A rejection needs a comment for the requester."
  >
    Requests <em>waiting for your decision.</em>
  </PageHeading>

  <form class="card mt-9 flex flex-wrap gap-4 p-5" aria-label="Filters" @submit.prevent>
    <div class="w-full sm:w-56">
      <label for="review-status-filter" class="mb-1 block text-sm font-semibold">Status</label>
      <select
        id="review-status-filter"
        class="field-input"
        :value="statusSelection"
        @change="changeStatusFilter"
      >
        <option v-for="status in vacationRequestStatusValues" :key="status" :value="status">
          {{ statusLabels[status] }}
        </option>
        <option :value="ALL_STATUSES">All statuses</option>
      </select>
    </div>
    <div class="w-full sm:w-56">
      <label for="review-requester-filter" class="mb-1 block text-sm font-semibold">
        Requester
      </label>
      <select
        id="review-requester-filter"
        class="field-input"
        :value="requesterFilter ?? ''"
        @change="changeRequesterFilter"
      >
        <option value="">All requesters</option>
        <option v-for="requester in requesters" :key="requester.id" :value="requester.id">
          {{ requester.name }}
        </option>
      </select>
    </div>
  </form>

  <div class="mt-5" :aria-busy="isLoading">
    <DataState
      :is-loading="isLoading && !requestPage"
      :error-message="errorMessage"
      :is-empty="requestPage?.items.length === 0"
      loading-label="Loading vacation requests"
      @retry="loadRequests"
    >
      <template #empty>
        <p v-if="statusFilter === VacationRequestStatus.Pending && !requesterFilter">
          No requests are waiting for a decision. New requests will appear here.
        </p>
        <p v-else-if="hasFilters">
          No requests match these filters. Change the status or the requester to see more.
        </p>
        <p v-else>Nobody has requested a vacation yet.</p>
      </template>

      <template v-if="requestPage">
        <VacationRequestList
          :vacation-requests="requestPage.items"
          :shows-requester="true"
          label="Vacation requests of the team"
        >
          <template #actions="{ vacationRequest }">
            <template v-if="canDecide(vacationRequest)">
              <button
                type="button"
                class="button button-primary"
                @click="requestToApprove = vacationRequest"
              >
                Approve
              </button>
              <button
                type="button"
                class="button button-danger-outline"
                @click="openRejection(vacationRequest)"
              >
                Reject
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
  </div>

  <ConfirmDialog
    :is-open="requestToApprove !== null"
    title="Approve this request?"
    :message="requestToApprove ? describeRequest(requestToApprove) : ''"
    confirm-label="Approve request"
    cancel-label="Keep it pending"
    :is-busy="isDeciding"
    @confirm="confirmApproval"
    @cancel="requestToApprove = null"
  />

  <RejectRequestDialog
    :vacation-request="requestToReject"
    :is-busy="isDeciding"
    :server-error-message="rejectionErrorMessage"
    @confirm="confirmRejection"
    @cancel="requestToReject = null"
  />
</template>
