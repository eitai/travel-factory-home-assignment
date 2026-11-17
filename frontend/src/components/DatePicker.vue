<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  addDays,
  addMonths,
  createIsoDate,
  firstDayOfMonth,
  formatDate,
  formatLongDate,
  getDayOfMonth,
  getIsoWeekday,
  getMonthIndex,
  getYear,
  lastDayOfMonth,
  listDatesInRange,
  listMonthNames,
  listWeekdayNames,
  todayIsoDate,
  type IsoDate,
} from '@vacation-manager/shared';

const DAYS_PER_WEEK = 7;
const SELECTABLE_YEARS_AHEAD = 5;
const WEEKDAY_ABBREVIATION_LENGTH = 2;

const props = defineProps<{
  id: string;
  modelValue: string;
  label: string;
  min?: IsoDate;
  isRequired?: boolean;
  isInvalid?: boolean;
  describedBy?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [date: string] }>();

const today = todayIsoDate();
const monthNames = listMonthNames();
const weekdayNames = listWeekdayNames();

const rootElement = ref<HTMLElement | null>(null);
const triggerElement = ref<HTMLButtonElement | null>(null);
const isOpen = ref(false);
const focusedDate = ref<IsoDate>(today);

const popoverId = computed(() => `${props.id}-calendar`);
const shownYear = computed(() => getYear(focusedDate.value));
const shownMonthIndex = computed(() => getMonthIndex(focusedDate.value));

function isSelectable(date: IsoDate): boolean {
  return !props.min || date >= props.min;
}

function toSelectable(date: IsoDate): IsoDate {
  return props.min && date < props.min ? props.min : date;
}

const yearOptions = computed(() => {
  const firstYear = getYear(props.min ?? today);
  const years = Array.from(
    { length: SELECTABLE_YEARS_AHEAD + 1 },
    (_unused, yearOffset) => firstYear + yearOffset,
  );
  return years.includes(shownYear.value)
    ? years
    : [...years, shownYear.value].sort(
        (firstYearOption, secondYearOption) => firstYearOption - secondYearOption,
      );
});

const monthOptions = computed(() =>
  monthNames.map((monthName, monthIndex) => ({
    monthName,
    monthIndex,
    isSelectable: isSelectable(lastDayOfMonth(shownYear.value, monthIndex)),
  })),
);

const weeks = computed(() => {
  const firstDay = firstDayOfMonth(shownYear.value, shownMonthIndex.value);
  const lastDay = lastDayOfMonth(shownYear.value, shownMonthIndex.value);
  const emptyCellsBeforeFirstDay = Array.from({ length: getIsoWeekday(firstDay) - 1 }, () => null);
  const cells: (IsoDate | null)[] = [
    ...emptyCellsBeforeFirstDay,
    ...listDatesInRange(firstDay, lastDay),
  ];

  const weekRows: (IsoDate | null)[][] = [];
  for (let cellIndex = 0; cellIndex < cells.length; cellIndex += DAYS_PER_WEEK) {
    weekRows.push(cells.slice(cellIndex, cellIndex + DAYS_PER_WEEK));
  }
  return weekRows;
});

async function focusDay(date: IsoDate): Promise<void> {
  focusedDate.value = date;
  await nextTick();
  rootElement.value?.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)?.focus();
}

function open(): void {
  isOpen.value = true;
  void focusDay(toSelectable(props.modelValue || today));
}

function close(returnsFocusToField: boolean): void {
  isOpen.value = false;
  if (returnsFocusToField) {
    triggerElement.value?.focus();
  }
}

function toggle(): void {
  if (isOpen.value) {
    close(true);
  } else {
    open();
  }
}

function selectDate(date: IsoDate): void {
  emit('update:modelValue', date);
  close(true);
}

function clearDate(): void {
  emit('update:modelValue', '');
  close(true);
}

function showMonth(year: number, monthIndex: number): void {
  const lastDayNumber = getDayOfMonth(lastDayOfMonth(year, monthIndex));
  const dayOfMonth = Math.min(getDayOfMonth(focusedDate.value), lastDayNumber);
  focusedDate.value = toSelectable(createIsoDate(year, monthIndex, dayOfMonth));
}

function changeMonth(changeEvent: Event): void {
  showMonth(shownYear.value, Number((changeEvent.target as HTMLSelectElement).value));
}

function changeYear(changeEvent: Event): void {
  showMonth(Number((changeEvent.target as HTMLSelectElement).value), shownMonthIndex.value);
}

const keyboardMoves: Record<string, (date: IsoDate) => IsoDate> = {
  ArrowLeft: (date) => addDays(date, -1),
  ArrowRight: (date) => addDays(date, 1),
  ArrowUp: (date) => addDays(date, -DAYS_PER_WEEK),
  ArrowDown: (date) => addDays(date, DAYS_PER_WEEK),
  Home: (date) => addDays(date, 1 - getIsoWeekday(date)),
  End: (date) => addDays(date, DAYS_PER_WEEK - getIsoWeekday(date)),
  PageUp: (date) => addMonths(date, -1),
  PageDown: (date) => addMonths(date, 1),
};

function moveFocusWithKeyboard(keyboardEvent: KeyboardEvent): void {
  const moveDate = keyboardMoves[keyboardEvent.key];
  if (!moveDate) {
    return;
  }
  keyboardEvent.preventDefault();
  void focusDay(toSelectable(moveDate(focusedDate.value)));
}

function closeOnPointerOutside(pointerEvent: PointerEvent): void {
  if (!rootElement.value?.contains(pointerEvent.target as Node)) {
    close(false);
  }
}

function closeWhenFocusLeaves(focusEvent: FocusEvent): void {
  const nextFocusedElement = focusEvent.relatedTarget as Node | null;
  if (isOpen.value && nextFocusedElement && !rootElement.value?.contains(nextFocusedElement)) {
    close(false);
  }
}

watch(isOpen, (isNowOpen) => {
  if (isNowOpen) {
    document.addEventListener('pointerdown', closeOnPointerOutside);
  } else {
    document.removeEventListener('pointerdown', closeOnPointerOutside);
  }
});

onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnPointerOutside));
</script>

<template>
  <div ref="rootElement" class="relative" @focusout="closeWhenFocusLeaves">
    <button
      :id="id"
      ref="triggerElement"
      type="button"
      role="combobox"
      class="field-input flex items-center justify-between gap-3 text-left"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="popoverId"
      :aria-required="isRequired"
      :aria-invalid="isInvalid"
      :aria-describedby="describedBy"
      @click="toggle"
    >
      <span :class="modelValue ? 'tabular-nums' : 'text-ink-muted'">
        {{ modelValue ? formatDate(modelValue) : 'Choose a date' }}
      </span>
      <span class="date-picker-caret" aria-hidden="true"></span>
    </button>

    <div
      v-if="isOpen"
      :id="popoverId"
      role="dialog"
      :aria-label="`Choose the ${label.toLowerCase()}`"
      class="date-picker-popover"
      @keydown.esc.stop.prevent="close(true)"
    >
      <div class="flex gap-2 px-2">
        <select
          class="field-input field-input-compact flex-1"
          aria-label="Month"
          :value="shownMonthIndex"
          @change="changeMonth"
        >
          <option
            v-for="monthOption in monthOptions"
            :key="monthOption.monthIndex"
            :value="monthOption.monthIndex"
            :disabled="!monthOption.isSelectable"
          >
            {{ monthOption.monthName }}
          </option>
        </select>
        <select
          class="field-input field-input-compact w-[5.75rem]"
          aria-label="Year"
          :value="shownYear"
          @change="changeYear"
        >
          <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>

      <table
        role="grid"
        class="mt-2 w-full table-fixed border-collapse text-center"
        :aria-label="`${monthNames[shownMonthIndex]} ${shownYear}`"
        @keydown="moveFocusWithKeyboard"
      >
        <thead>
          <tr>
            <th
              v-for="weekdayName in weekdayNames"
              :key="weekdayName.long"
              scope="col"
              class="pb-1 text-xs font-semibold text-ink-muted"
            >
              <abbr :title="weekdayName.long" class="no-underline">
                {{ weekdayName.short.slice(0, WEEKDAY_ABBREVIATION_LENGTH) }}
              </abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(week, weekIndex) in weeks" :key="weekIndex">
            <td v-for="(date, dayIndex) in week" :key="date ?? `empty-${dayIndex}`" class="p-0">
              <button
                v-if="date"
                type="button"
                class="date-picker-day"
                :class="{
                  'date-picker-day-today': date === today,
                  'date-picker-day-selected': date === modelValue,
                }"
                :data-date="date"
                :tabindex="date === focusedDate ? 0 : -1"
                :disabled="!isSelectable(date)"
                :aria-label="formatLongDate(date)"
                :aria-pressed="date === modelValue"
                :aria-current="date === today ? 'date' : undefined"
                @click="selectDate(date)"
              >
                {{ getDayOfMonth(date) }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mx-2 mt-2 flex justify-between gap-2 border-t border-line pt-2">
        <button type="button" class="button px-3" :disabled="!modelValue" @click="clearDate">
          Clear
        </button>
        <button
          type="button"
          class="button px-3"
          :disabled="!isSelectable(today)"
          @click="selectDate(today)"
        >
          Today
        </button>
      </div>
    </div>
  </div>
</template>
