<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loginSchema, validateWithSchema, type FieldErrors } from '@vacation-manager/shared';
import FormField from '../components/FormField.vue';
import PageHeading from '../components/PageHeading.vue';
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
  <main
    class="mx-auto grid min-h-dvh max-w-5xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_26rem]"
  >
    <div>
      <p class="mb-6 font-display text-[1.625rem] font-medium text-accent-strong italic">
        Vacation Manager
      </p>
      <PageHeading lead="Sign in to ask for days off, or to review the requests of your team.">
        Time off, <em>without the back and forth.</em>
      </PageHeading>
    </div>

    <div>
      <p v-if="sessionExpired" role="status" class="card mb-4 border-pending p-4">
        Your session ended. Sign in again to continue.
      </p>

      <form novalidate class="card space-y-4 p-6" @submit.prevent="signIn">
        <h2 class="section-title">Sign in</h2>

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

        <p v-if="signInErrorMessage" role="alert" class="text-sm font-semibold text-danger">
          {{ signInErrorMessage }}
        </p>

        <button type="submit" class="button button-primary button-large" :disabled="isSigningIn">
          {{ isSigningIn ? 'Signing in' : 'Sign in' }}
        </button>
      </form>

      <section aria-labelledby="demo-accounts-heading" class="mt-6 px-1">
        <h2 id="demo-accounts-heading" class="font-bold">Demo accounts</h2>
        <p class="mt-1 text-[0.9375rem] text-ink-muted">
          Choose an account to fill in the form, then sign in.
        </p>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li v-for="demoAccount in demoAccounts" :key="demoAccount.email">
            <button type="button" class="button" @click="fillDemoAccount(demoAccount.email)">
              {{ demoAccount.label }}
            </button>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
