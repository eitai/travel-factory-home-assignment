<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  countDaysInclusive,
  createVacationRequestInputSchema,
  isDateRangeOrdered,
  MAX_REASON_LENGTH,
  todayIsoDate,
  validateWithSchema,
  type FieldErrors,
  type VacationRequestDto,
} from '@vacation-manager/shared';
import { readApiError } from '../services/errorService';
import { formatDayCount } from '../services/presentationService';
import { useAppStore } from '../store';
import FormField from './FormField.vue';

const props = defineProps<{ editedRequest: VacationRequestDto | null }>();
const emit = defineEmits<{ finished: [] }>();

const store = useAppStore();
const today = todayIsoDate();

const formValues = reactive({ startDate: '', endDate: '', reason: '' });
const fieldErrors = ref<FieldErrors>({});
const formErrorMessage = ref<string | null>(null);
const isSaving = ref(false);

const isEditing = computed(() => props.editedRequest !== null);
const earliestEndDate = computed(() => formValues.startDate || today);

const vacationLength = computed(() => {
  const { startDate, endDate } = formValues;
  if (!startDate || !endDate || !isDateRangeOrdered(startDate, endDate)) {
    return null;
  }
  return formatDayCount(countDaysInclusive(startDate, endDate));
});

function clearErrors(): void {
  fieldErrors.value = {};
  formErrorMessage.value = null;
}

function fillForm(vacationRequest: VacationRequestDto | null): void {
  formValues.startDate = vacationRequest?.startDate ?? '';
  formValues.endDate = vacationRequest?.endDate ?? '';
  formValues.reason = vacationRequest?.reason ?? '';
  clearErrors();
}

watch(() => props.editedRequest, fillForm, { immediate: true });

watch(
  () => formValues.startDate,
  (startDate) => {
    if (startDate && formValues.endDate && formValues.endDate < startDate) {
      formValues.endDate = startDate;
    }
  },
);

function stopEditing(): void {
  fillForm(null);
  emit('finished');
}

async function save(): Promise<void> {
  const validation = validateWithSchema(createVacationRequestInputSchema(today), formValues);
  if (!validation.isValid) {
    fieldErrors.value = validation.fieldErrors;
    formErrorMessage.value = null;
    return;
  }

  isSaving.value = true;
  clearErrors();
  try {
    if (props.editedRequest) {
      await store.dispatch('myRequests/update', {
        vacationRequestId: props.editedRequest.id,
        formValues: validation.data,
      });
      await store.dispatch('notifications/notifySuccess', 'Your changes are saved.');
    } else {
      await store.dispatch('myRequests/submit', validation.data);
      await store.dispatch(
        'notifications/notifySuccess',
        'Your request is submitted and waiting for review.',
      );
    }
    stopEditing();
  } catch (error) {
    const readableError = readApiError(error);
    const hasFieldErrors = Object.keys(readableError.fields).length > 0;
    fieldErrors.value = readableError.fields;
    formErrorMessage.value = hasFieldErrors ? null : readableError.message;
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <section aria-labelledby="vacation-form-heading" class="panel p-5">
    <h2 id="vacation-form-heading" class="text-lg font-semibold">
      {{ isEditing ? 'Edit your request' : 'Request a vacation' }}
    </h2>

    <form novalidate class="mt-4 space-y-4" @submit.prevent="save">
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField
          field-id="start-date"
          label="First day off"
          :error-message="fieldErrors.startDate"
        >
          <template #default="{ describedBy, isInvalid }">
            <input
              id="start-date"
              v-model="formValues.startDate"
              type="date"
              class="field-input"
              required
              :min="today"
              :aria-invalid="isInvalid"
              :aria-describedby="describedBy"
            />
          </template>
        </FormField>

        <FormField field-id="end-date" label="Last day off" :error-message="fieldErrors.endDate">
          <template #default="{ describedBy, isInvalid }">
            <input
              id="end-date"
              v-model="formValues.endDate"
              type="date"
              class="field-input"
              required
              :min="earliestEndDate"
              :aria-invalid="isInvalid"
              :aria-describedby="describedBy"
            />
          </template>
        </FormField>
      </div>

      <p aria-live="polite" class="min-h-6 text-sm font-medium">
        <template v-if="vacationLength">Length: {{ vacationLength }}</template>
      </p>

      <FormField
        field-id="reason"
        label="Reason"
        is-optional
        hint="Only you and the validators can read this."
        :error-message="fieldErrors.reason"
      >
        <template #default="{ describedBy, isInvalid }">
          <textarea
            id="reason"
            v-model="formValues.reason"
            rows="2"
            class="field-input"
            :maxlength="MAX_REASON_LENGTH"
            :aria-invalid="isInvalid"
            :aria-describedby="describedBy"
          ></textarea>
        </template>
      </FormField>

      <p v-if="formErrorMessage" role="alert" class="text-sm font-medium text-danger">
        {{ formErrorMessage }}
      </p>

      <div class="flex flex-wrap gap-3">
        <button type="submit" class="button button-primary" :disabled="isSaving">
          {{ isEditing ? 'Save changes' : 'Submit request' }}
        </button>
        <button
          v-if="isEditing"
          type="button"
          class="button button-secondary"
          :disabled="isSaving"
          @click="stopEditing"
        >
          Keep it as it was
        </button>
      </div>
    </form>
  </section>
</template>
