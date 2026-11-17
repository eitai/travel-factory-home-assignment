import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router';
import { ability } from '../plugins/ability';
import { store } from '../store';

const PRODUCT_NAME = 'Vacation Manager';

export function getHomeRoute(): RouteLocationRaw {
  return ability.can('readAll', 'VacationRequest') ? { name: 'review' } : { name: 'myRequests' };
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: 'Sign in', isPublic: true },
    },
    {
      path: '/',
      name: 'home',
      redirect: () => getHomeRoute(),
      meta: { title: PRODUCT_NAME },
    },
    {
      path: '/my-requests',
      name: 'myRequests',
      component: () => import('../views/MyRequestsView.vue'),
      meta: { title: 'My requests', permission: { action: 'read', subject: 'VacationRequest' } },
    },
    {
      path: '/review',
      name: 'review',
      component: () => import('../views/ReviewDashboardView.vue'),
      meta: {
        title: 'Review requests',
        permission: { action: 'readAll', subject: 'VacationRequest' },
      },
    },
    {
      path: '/team-calendar',
      name: 'teamCalendar',
      component: () => import('../views/TeamCalendarView.vue'),
      meta: { title: 'Team calendar', permission: { action: 'read', subject: 'TeamCalendar' } },
    },
    {
      path: '/:unknownPath(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Page not found', isPublic: true },
    },
  ],
});

router.beforeEach(async (destination) => {
  await store.dispatch('auth/restoreSession');
  const isSignedIn = store.getters['auth/isSignedIn'] as boolean;

  if (destination.name === 'login') {
    return isSignedIn ? getHomeRoute() : true;
  }
  if (destination.meta.isPublic) {
    return true;
  }
  if (!isSignedIn) {
    return { name: 'login', query: { redirect: destination.fullPath } };
  }

  const requiredPermission = destination.meta.permission;
  if (requiredPermission && ability.cannot(requiredPermission.action, requiredPermission.subject)) {
    return getHomeRoute();
  }
  return true;
});

router.afterEach((destination) => {
  document.title =
    destination.meta.title === PRODUCT_NAME
      ? PRODUCT_NAME
      : `${destination.meta.title} · ${PRODUCT_NAME}`;
});
