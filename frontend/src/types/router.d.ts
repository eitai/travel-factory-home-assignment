import type { Permission } from '@vacation-manager/shared';

declare module 'vue-router' {
  interface RouteMeta {
    title: string;
    isPublic?: boolean;
    permission?: Permission;
  }
}

export {};
