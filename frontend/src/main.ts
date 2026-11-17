import { abilitiesPlugin } from '@casl/vue';
import '@fontsource-variable/figtree';
import '@fontsource-variable/fraunces/opsz-italic.css';
import '@fontsource-variable/fraunces/opsz.css';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { ability } from './plugins/ability';
import { router } from './router';
import { onSessionExpired } from './services/httpClient';
import { endSession } from './services/sessionService';
import { store, storeKey } from './store';

onSessionExpired(() => endSession('expired'));

createApp(App).use(store, storeKey).use(router).use(abilitiesPlugin, ability).mount('#app');
