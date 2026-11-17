import type { Module } from 'vuex';
import type { TeamCalendarMemberDto } from '@vacation-manager/shared';
import { readApiError } from '../../services/errorService';
import { fetchTeamCalendar, type TeamCalendarPeriod } from '../../services/teamCalendarService';
import type { RootState } from '../index';

export interface TeamCalendarState {
  members: TeamCalendarMemberDto[];
  hasLoaded: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

export const teamCalendarModule: Module<TeamCalendarState, RootState> = {
  namespaced: true,

  state: () => ({
    members: [],
    hasLoaded: false,
    isLoading: false,
    errorMessage: null,
  }),

  mutations: {
    loadStarted(state) {
      state.isLoading = true;
      state.errorMessage = null;
    },
    loadSucceeded(state, members: TeamCalendarMemberDto[]) {
      state.members = members;
      state.hasLoaded = true;
      state.isLoading = false;
    },
    loadFailed(state, errorMessage: string) {
      state.isLoading = false;
      state.errorMessage = errorMessage;
    },
  },

  actions: {
    async load({ commit }, period: TeamCalendarPeriod) {
      commit('loadStarted');
      try {
        commit('loadSucceeded', await fetchTeamCalendar(period));
      } catch (error) {
        commit('loadFailed', readApiError(error).message);
      }
    },
  },
};
