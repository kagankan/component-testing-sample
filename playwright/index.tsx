import { beforeMount } from '@playwright/experimental-ct-react/hooks';

// https://playwright.dev/docs/test-components#hooks
export type HooksConfig = {
  enableRouting?: boolean;
};


beforeMount<HooksConfig>(async ({ App }) => {
  return (
    <App />
  );
});
