import { onBeforeUnmount, ref, type Ref } from 'vue';

const WIDE_SCREEN_QUERY = '(min-width: 768px)';

export function useIsWideScreen(): Ref<boolean> {
  const mediaQuery = window.matchMedia(WIDE_SCREEN_QUERY);
  const isWideScreen = ref(mediaQuery.matches);

  const updateFromMediaQuery = (changeEvent: MediaQueryListEvent): void => {
    isWideScreen.value = changeEvent.matches;
  };
  mediaQuery.addEventListener('change', updateFromMediaQuery);
  onBeforeUnmount(() => mediaQuery.removeEventListener('change', updateFromMediaQuery));

  return isWideScreen;
}
