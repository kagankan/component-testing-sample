import type { Meta, StoryObj } from "@storybook/react-vite";

import { Sample } from ".";

const meta = {
  component: Sample,
} satisfies Meta<typeof Sample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
