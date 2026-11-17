import type { Module } from 'vuex';
import type { LoginInput, UserDto } from '@vacation-manager/shared';
import { applyAbilityFor } from '../../plugins/ability';
import { fetchCurrentUser, login } from '../../services/authService';
import { clearStoredToken, readStoredToken, storeToken } from '../../services/tokenStorageService';
import type { RootState } from '../index';

export interface AuthState {
  user: UserDto | null;
  hasRestoredSession: boolean;
}

export const authModule: Module<AuthState, RootState> = {
  namespaced: true,

  state: () => ({
    user: null,
    hasRestoredSession: false,
  }),

  getters: {
    isSignedIn: (state): boolean => state.user !== null,
  },

  mutations: {
    userSignedIn(state, user: UserDto) {
      state.user = user;
    },
    sessionRestored(state) {
      state.hasRestoredSession = true;
    },
  },

  actions: {
    async login({ commit }, credentials: LoginInput) {
      const { token, user } = await login(credentials);
      storeToken(token);
      applyAbilityFor(user);
      commit('userSignedIn', user);
    },

    async restoreSession({ commit, state }) {
      if (state.hasRestoredSession) {
        return;
      }
      if (readStoredToken()) {
        try {
          const user = await fetchCurrentUser();
          applyAbilityFor(user);
          commit('userSignedIn', user);
        } catch {
          clearStoredToken();
        }
      }
      commit('sessionRestored');
    },
  },
};
