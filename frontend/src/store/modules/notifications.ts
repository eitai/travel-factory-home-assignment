import type { Module } from 'vuex';
import type { RootState } from '../index';

const SUCCESS_VISIBLE_MILLISECONDS = 6_000;

export type NotificationKind = 'success' | 'error';

export interface Notification {
  id: number;
  kind: NotificationKind;
  message: string;
}

export interface NotificationsState {
  notifications: Notification[];
  nextNotificationId: number;
}

export const notificationsModule: Module<NotificationsState, RootState> = {
  namespaced: true,

  state: () => ({
    notifications: [],
    nextNotificationId: 1,
  }),

  mutations: {
    notificationAdded(state, notification: Omit<Notification, 'id'>) {
      state.notifications.push({ id: state.nextNotificationId, ...notification });
      state.nextNotificationId += 1;
    },
    notificationDismissed(state, notificationId: number) {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== notificationId,
      );
    },
  },

  actions: {
    notifySuccess({ commit, state }, message: string) {
      const notificationId = state.nextNotificationId;
      commit('notificationAdded', { kind: 'success', message });
      window.setTimeout(
        () => commit('notificationDismissed', notificationId),
        SUCCESS_VISIBLE_MILLISECONDS,
      );
    },

    notifyError({ commit }, message: string) {
      commit('notificationAdded', { kind: 'error', message });
    },

    dismiss({ commit }, notificationId: number) {
      commit('notificationDismissed', notificationId);
    },
  },
};
