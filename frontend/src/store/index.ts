import type { InjectionKey } from 'vue';
import { createStore, useStore, type Store } from 'vuex';
import { authModule, type AuthState } from './modules/auth';
import { myRequestsModule, type MyRequestsState } from './modules/myRequests';
import { notificationsModule, type NotificationsState } from './modules/notifications';
import { reviewQueueModule, type ReviewQueueState } from './modules/reviewQueue';
import { teamCalendarModule, type TeamCalendarState } from './modules/teamCalendar';

export interface RootState {
  auth: AuthState;
  myRequests: MyRequestsState;
  reviewQueue: ReviewQueueState;
  teamCalendar: TeamCalendarState;
  notifications: NotificationsState;
}

export const storeKey: InjectionKey<Store<RootState>> = Symbol('store');

export const store = createStore<RootState>({
  modules: {
    auth: authModule,
    myRequests: myRequestsModule,
    reviewQueue: reviewQueueModule,
    teamCalendar: teamCalendarModule,
    notifications: notificationsModule,
  },
});

export function useAppStore(): Store<RootState> {
  return useStore(storeKey);
}
