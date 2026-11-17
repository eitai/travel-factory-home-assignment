import type { Module } from 'vuex';
import type { PaginatedResult, VacationRequestDto } from '@vacation-manager/shared';
import { readApiError } from '../../services/errorService';
import {
  cancelVacationRequest,
  fetchMyVacationRequests,
  submitVacationRequest,
  updateVacationRequest,
  type MyVacationRequestsFilters,
  type VacationRequestFormValues,
} from '../../services/vacationRequestService';
import type { RootState } from '../index';

export interface MyRequestsState {
  page: PaginatedResult<VacationRequestDto> | null;
  filters: MyVacationRequestsFilters | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface UpdateMyRequestPayload {
  vacationRequestId: number;
  formValues: VacationRequestFormValues;
}

export const myRequestsModule: Module<MyRequestsState, RootState> = {
  namespaced: true,

  state: () => ({
    page: null,
    filters: null,
    isLoading: false,
    errorMessage: null,
  }),

  mutations: {
    loadStarted(state, filters: MyVacationRequestsFilters) {
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
  },

  actions: {
    async load({ commit }, filters: MyVacationRequestsFilters) {
      commit('loadStarted', filters);
      try {
        commit('loadSucceeded', await fetchMyVacationRequests(filters));
      } catch (error) {
        commit('loadFailed', readApiError(error).message);
      }
    },

    async reload({ dispatch, state }) {
      if (state.filters) {
        await dispatch('load', state.filters);
      }
    },

    async submit({ dispatch }, formValues: VacationRequestFormValues) {
      await submitVacationRequest(formValues);
      await dispatch('reload');
    },

    async update({ dispatch }, { vacationRequestId, formValues }: UpdateMyRequestPayload) {
      await updateVacationRequest(vacationRequestId, formValues);
      await dispatch('reload');
    },

    async cancel({ dispatch }, vacationRequestId: number) {
      await cancelVacationRequest(vacationRequestId);
      await dispatch('reload');
    },
  },
};
