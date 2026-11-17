<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loginSchema, validateWithSchema, type FieldErrors } from '@vacation-manager/shared';
import FormField from '../components/FormField.vue';
import { getHomeRoute } from '../router';
import { readApiError } from '../services/errorService';
import { readQueryText } from '../services/routeQueryService';
import { isSafeRedirectPath } from '../services/sessionService';
import { useAppStore } from '../store';

const DEMO_PASSWORD = 'Password123!';
const demoAccounts = [
  { label: 'Requester One', email: 'requester1@example.com' },
  { label: 'Requester Two', email: 'requester2@example.com' },
  { label: 'Validator One', email: 'validator@example.com' },
];

const store = useAppStore();
const route = useRoute();
const router = useRouter();

const credentials = reactive({ email: '', password: '' });
const fieldErrors = ref<FieldErrors>({});
const signInErrorMessage = ref<string | null>(null);
const isSigningIn = ref(false);

const sessionExpired = readQueryText(route.query, 'reason') === 'expired';

function fillDemoAccount(email: string): void {
  credentials.email = email;
  credentials.password = DEMO_PASSWORD;
  fieldErrors.value = {};
  signInErrorMessage.value = null;
}

async function signIn(): Promise<void> {
  const validation = validateWithSchema(loginSchema, credentials);
  if (!validation.isValid) {
    fieldErrors.value = validation.fieldErrors;
    signInErrorMessage.value = null;
    return;
  }

  isSigningIn.value = true;
  fieldErrors.value = {};
  signInErrorMessage.value = null;
  try {
    await store.dispatch('auth/login', validation.data);
    const redirectPath = readQueryText(route.query, 'redirect');
    await router.replace(isSafeRedirectPath(redirectPath) ? redirectPath : getHomeRoute());
  } catch (error) {
    const readableError = readApiError(error);
    fieldErrors.value = readableError.fields;
    signInErrorMessage.value =
      Object.keys(readableError.fields).length > 0 ? null : readableError.message;
  } finally {
    isSigningIn.value = false;
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
    <h1 class="text-3xl font-semibold tracking-tight">Vacation Manager</h1>
    <p class="mt-2 text-ink-muted">
      Sign in to request time off or to review your team's requests.
    </p>

    <p v-if="sessionExpired" role="status" class="panel mt-6 border-pending p-4 text-sm">
      Your session ended. Sign in again to continue.
    </p>

    <form novalidate class="panel mt-6 space-y-4 p-6" @submit.prevent="signIn">
      <FormField field-id="email" label="Email" :error-message="fieldErrors.email">
        <template #default="{ describedBy, isInvalid }">
          <input
            id="email"
            v-model="credentials.email"
            type="email"
            class="field-input"
            autocomplete="username"
            required
            :aria-invalid="isInvalid"
            :aria-describedby="describedBy"
          />
        </template>
      </FormField>

      <FormField field-id="password" label="Password" :error-message="fieldErrors.password">
        <template #default="{ describedBy, isInvalid }">
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            class="field-input"
            autocomplete="current-password"
            required
            :aria-invalid="isInvalid"
            :aria-describedby="describedBy"
          />
        </template>
      </FormField>

      <p v-if="signInErrorMessage" role="alert" class="text-sm font-medium text-danger">
        {{ signInErrorMessage }}
      </p>

      <button type="submit" class="button button-primary w-full" :disabled="isSigningIn">
        {{ isSigningIn ? 'Signing in' : 'Sign in' }}
      </button>
    </form>

    <section aria-labelledby="demo-accounts-heading" class="mt-8">
      <h2 id="demo-accounts-heading" class="font-semibold">Demo accounts</h2>
      <p class="mt-1 text-sm text-ink-muted">
        Choose an account to fill in the form, then sign in.
      </p>
      <ul class="mt-3 flex flex-wrap gap-2">
        <li v-for="demoAccount in demoAccounts" :key="demoAccount.email">
          <button
            type="button"
            class="button button-secondary"
            @click="fillDemoAccount(demoAccount.email)"
          >
            {{ demoAccount.label }}
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>
