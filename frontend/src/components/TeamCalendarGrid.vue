<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  countDaysInclusive,
  formatWeekday,
  getDayOfMonth,
  isWeekend,
  listDatesInRange,
  type IsoDate,
  type TeamCalendarMemberDto,
  type VacationRequestStatus,
} from '@vacation-manager/shared';
import { statusLabels, vacationBarClasses } from '../services/presentationService';

const SHORTEST_BAR_WITH_LABEL_IN_DAYS = 3;

interface BarSegment {
  status: VacationRequestStatus;
  isStart: boolean;
  isEnd: boolean;
  label: string | null;
}

const props = defineProps<{
  members: TeamCalendarMemberDto[];
  firstDay: IsoDate;
  lastDay: IsoDate;
  today: IsoDate;
  label: string;
}>();

const days = computed(() =>
  listDatesInRange(props.firstDay, props.lastDay).map((date) => ({
    date,
    dayOfMonth: getDayOfMonth(date),
    weekday: formatWeekday(date),
    isWeekend: isWeekend(date),
    isToday: date === props.today,
  })),
);

const calendarRows = computed(() =>
  props.members.map((member) => {
    const segmentByDate = new Map<IsoDate, BarSegment>();
    for (const vacation of member.vacations) {
      const firstVisibleDay =
        vacation.startDate > props.firstDay ? vacation.startDate : props.firstDay;
      const lastVisibleDay = vacation.endDate < props.lastDay ? vacation.endDate : props.lastDay;
      const hasRoomForLabel =
        countDaysInclusive(firstVisibleDay, lastVisibleDay) >= SHORTEST_BAR_WITH_LABEL_IN_DAYS;

      for (const date of listDatesInRange(firstVisibleDay, lastVisibleDay)) {
        segmentByDate.set(date, {
          status: vacation.status,
          isStart: date === vacation.startDate,
          isEnd: date === vacation.endDate,
          label: hasRoomForLabel && date === firstVisibleDay ? statusLabels[vacation.status] : null,
        });
      }
    }
    return {
      userId: member.userId,
      userName: member.userName,
      cells: days.value.map((day) => ({
        date: day.date,
        isWeekend: day.isWeekend,
        segment: segmentByDate.get(day.date) ?? null,
      })),
    };
  }),
);

const scrollRegion = ref<HTMLElement | null>(null);

function bringTodayIntoView(): void {
  const region = scrollRegion.value;
  const todayColumn = region?.querySelector<HTMLElement>('th[aria-current="date"]');
  if (!region || !todayColumn) {
    return;
  }
  region.scrollLeft = todayColumn.offsetLeft - region.clientWidth / 2;
}

watch(() => [props.firstDay, props.members.length], bringTodayIntoView, {
  flush: 'post',
  immediate: true,
});
</script>

<template>
  <div
    ref="scrollRegion"
    class="card relative overflow-x-auto p-2"
    role="region"
    tabindex="0"
    :aria-label="label"
  >
    <table class="w-full min-w-[66rem] table-fixed border-collapse">
      <caption class="sr-only">
        {{
          label
        }}
      </caption>
      <thead>
        <tr class="border-b border-line">
          <th
            scope="col"
            class="sticky left-0 z-20 w-40 bg-panel px-3 pt-2 pb-3 text-left align-bottom text-sm font-semibold text-ink-muted"
          >
            Team member
          </th>
          <th
            v-for="day in days"
            :key="day.date"
            scope="col"
            class="px-0 pt-2 pb-3 text-center font-normal"
            :class="day.isWeekend ? 'bg-surface/70' : ''"
            :aria-current="day.isToday ? 'date' : undefined"
          >
            <span
              class="mx-auto grid size-8 place-items-center rounded-full font-display text-lg font-semibold tabular-nums"
              :class="[day.isToday ? 'bg-sun text-ink' : '', day.isWeekend ? 'text-ink-muted' : '']"
            >
              {{ day.dayOfMonth }}
            </span>
            <span class="block text-xs text-ink-muted">{{ day.weekday }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="calendarRow in calendarRows" :key="calendarRow.userId">
          <th scope="row" class="sticky left-0 z-20 bg-panel px-3 py-2 text-left font-semibold">
            {{ calendarRow.userName }}
          </th>
          <td
            v-for="cell in calendarRow.cells"
            :key="cell.date"
            class="h-12 px-0 py-2"
            :class="cell.isWeekend ? 'bg-surface/70' : ''"
          >
            <span
              v-if="cell.segment"
              class="vacation-bar"
              :class="[
                vacationBarClasses[cell.segment.status],
                cell.segment.isStart ? 'vacation-bar-start' : '',
                cell.segment.isEnd ? 'vacation-bar-end' : '',
              ]"
            >
              <span v-if="cell.segment.label" class="vacation-bar-label" aria-hidden="true">
                {{ cell.segment.label }}
              </span>
              <span class="sr-only">{{ statusLabels[cell.segment.status] }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
