<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  formatWeekday,
  getDayOfMonth,
  isWeekend,
  listDatesInRange,
  type IsoDate,
  type TeamCalendarMemberDto,
  type VacationRequestStatus,
} from '@vacation-manager/shared';
import { statusLabels, statusMarkerClasses } from '../services/presentationService';

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
    const statusByDate = new Map<IsoDate, VacationRequestStatus>();
    for (const vacation of member.vacations) {
      const firstVisibleDay =
        vacation.startDate > props.firstDay ? vacation.startDate : props.firstDay;
      const lastVisibleDay = vacation.endDate < props.lastDay ? vacation.endDate : props.lastDay;
      for (const date of listDatesInRange(firstVisibleDay, lastVisibleDay)) {
        statusByDate.set(date, vacation.status);
      }
    }
    return { userId: member.userId, userName: member.userName, statusByDate };
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
    class="panel relative overflow-x-auto"
    role="region"
    tabindex="0"
    :aria-label="label"
  >
    <table class="w-full min-w-[64rem] table-fixed border-collapse text-sm">
      <caption class="sr-only">
        {{
          label
        }}
      </caption>
      <thead>
        <tr class="border-b border-line">
          <th
            scope="col"
            class="sticky left-0 z-10 w-36 border-r border-line bg-panel px-3 py-2 text-left font-medium"
          >
            Team member
          </th>
          <th
            v-for="day in days"
            :key="day.date"
            scope="col"
            class="px-0 py-2 text-center font-medium tabular-nums"
            :class="[
              day.isWeekend ? 'bg-surface text-ink-muted' : '',
              day.isToday ? 'outline-2 -outline-offset-2 outline-accent' : '',
            ]"
            :aria-current="day.isToday ? 'date' : undefined"
          >
            <span class="block">{{ day.dayOfMonth }}</span>
            <span class="block text-[0.6875rem] font-normal">{{ day.weekday }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="calendarRow in calendarRows"
          :key="calendarRow.userId"
          class="border-b border-line last:border-b-0"
        >
          <th
            scope="row"
            class="sticky left-0 z-10 border-r border-line bg-panel px-3 py-2 text-left font-medium"
          >
            {{ calendarRow.userName }}
          </th>
          <td
            v-for="day in days"
            :key="day.date"
            class="h-11 p-0.5"
            :class="day.isWeekend ? 'bg-surface' : ''"
          >
            <span
              v-if="calendarRow.statusByDate.get(day.date)"
              class="status-marker block size-full"
              :class="statusMarkerClasses[calendarRow.statusByDate.get(day.date)!]"
            >
              <span class="sr-only">
                {{ statusLabels[calendarRow.statusByDate.get(day.date)!] }}
              </span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
