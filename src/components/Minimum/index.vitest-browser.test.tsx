import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Sample } from '.';

test('loads and displays Sample', async () => {
  // Render a React element into the DOM
  const screen = render(<Sample />);

  await expect.element(screen.getByText('Sample')).toBeVisible();
});
