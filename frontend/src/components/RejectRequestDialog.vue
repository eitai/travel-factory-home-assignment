<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  MAX_COMMENT_LENGTH,
  rejectVacationRequestSchema,
  validateWithSchema,
  type VacationRequestDto,
} from '@vacation-manager/shared';
import { keepDialogInSync } from '../services/dialogService';
import { formatDateRange } from '../services/presentationService';
import FormField from './FormField.vue';

const props = defineProps<{
  vacationRequest: VacationRequestDto | null;
  isBusy: boolean;
  serverErrorMessage: string | null;
}>();

const emit = defineEmits<{ confirm: [comment: string]; cancel: [] }>();

const dialogElement = ref<HTMLDialogElement | null>(null);
const comment = ref('');
const commentErrorMessage = ref<string | undefined>(undefined);

keepDialogInSync(dialogElement, () => props.vacationRequest !== null);

watch(
  () => props.vacationRequest,
  () => {
    comment.value = '';
    commentErrorMessage.value = undefined;
  },
);

function confirmRejection(): void {
  const validation = validateWithSchema(rejectVacationRequestSchema, { comment: comment.value });
  if (!validation.isValid) {
    commentErrorMessage.value = validation.fieldErrors.comment;
    return;
  }
  commentErrorMessage.value = undefined;
  emit('confirm', validation.data.comment);
}
</script>

<template>
  <dialog
    ref="dialogElement"
    class="dialog-panel"
    aria-labelledby="reject-dialog-title"
    @cancel.prevent="$emit('cancel')"
  >
    <form v-if="vacationRequest" novalidate @submit.prevent="confirmRejection">
      <h2 id="reject-dialog-title" class="text-lg font-semibold">Reject this request</h2>
      <p class="mt-2">
        {{ vacationRequest.userName }},
        {{ formatDateRange(vacationRequest.startDate, vacationRequest.endDate) }}
      </p>

      <div class="mt-4">
        <FormField
          field-id="rejection-comment"
          label="Why is it rejected?"
          hint="The requester will read this comment."
          :error-message="commentErrorMessage ?? serverErrorMessage ?? undefined"
        >
          <template #default="{ describedBy, isInvalid }">
            <textarea
              id="rejection-comment"
              v-model="comment"
              rows="3"
              class="field-input"
              required
              :maxlength="MAX_COMMENT_LENGTH"
              :aria-invalid="isInvalid"
              :aria-describedby="describedBy"
            ></textarea>
          </template>
        </FormField>
      </div>

      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          class="button button-secondary"
          :disabled="isBusy"
          @click="$emit('cancel')"
        >
          Keep it pending
        </button>
        <button type="submit" class="button button-danger" :disabled="isBusy">
          Reject request
        </button>
      </div>
    </form>
  </dialog>
</template>
