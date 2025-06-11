import { expect, test } from '@playwright/experimental-ct-react';
import { Sample } from './Sample';

test('should work', async ({ mount }) => {
  const component = await mount(<Sample />);
  await expect(component.getByText('Sample')).toBeVisible();
});
