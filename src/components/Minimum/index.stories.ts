import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Sample } from ".";

const meta = {
  component: Sample,
} satisfies Meta<typeof Sample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText("サンプルテキスト")).toBeVisible();
  },
};
