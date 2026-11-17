import type { Module } from 'vuex';
import type { PaginatedResult, UserSummaryDto, VacationRequestDto } from '@vacation-manager/shared';
import { readApiError } from '../../services/errorService';
import { fetchRequesters } from '../../services/userService';
import {
  approveVacationRequest,
  fetchAllVacationRequests,
  rejectVacationRequest,
  type AllVacationRequestsFilters,
} from '../../services/vacationRequestService';
import type { RootState } from '../index';

export interface ReviewQueueState {
  page: PaginatedResult<VacationRequestDto> | null;
  filters: AllVacationRequestsFilters | null;
  requesters: UserSummaryDto[];
  isLoading: boolean;
  errorMessage: string | null;
}

export interface RejectRequestPayload {
  vacationRequestId: number;
  comment: string;
}

export const reviewQueueModule: Module<ReviewQueueState, RootState> = {
  namespaced: true,

  state: () => ({
    page: null,
    filters: null,
    requesters: [],
    isLoading: false,
    errorMessage: null,
  }),

  mutations: {
    loadStarted(state, filters: AllVacationRequestsFilters) {
      state.filters = filters;
      state.isLoading = true;
      state.errorMessage = null;
    },
    loadSucceeded(state, page: PaginatedResult<VacationRequestDto>) {
      state.page = page;
      state.isLoading = false;
    },
    loadFailed(state, errorMessage: string) {
      state.isLoading = false;
      state.errorMessage = errorMessage;
    },
    requestersLoaded(state, requesters: UserSummaryDto[]) {
      state.requesters = requesters;
    },
  },

  actions: {
    async load({ commit }, filters: AllVacationRequestsFilters) {
      commit('loadStarted', filters);
      try {
        commit('loadSucceeded', await fetchAllVacationRequests(filters));
      } catch (error) {
        commit('loadFailed', readApiError(error).message);
      }
    },

    async reload({ dispatch, state }) {
      if (state.filters) {
        await dispatch('load', state.filters);
      }
    },

    async loadRequesters({ commit, state }) {
      if (state.requesters.length > 0) {
        return;
      }
      commit('requestersLoaded', await fetchRequesters());
    },

    async approve({ dispatch }, vacationRequestId: number) {
      await approveVacationRequest(vacationRequestId);
      await dispatch('reload');
    },

    async reject({ dispatch }, { vacationRequestId, comment }: RejectRequestPayload) {
      await rejectVacationRequest(vacationRequestId, comment);
      await dispatch('reload');
    },
  },
};
