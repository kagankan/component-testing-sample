import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from 'storybook/test';
import { http, HttpResponse } from 'msw'

import { SampleForm } from ".";

const meta = {
  component: SampleForm,
} satisfies Meta<typeof SampleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userId: 1,
    onError: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/users/1", () => {
          return HttpResponse.json({ id: 1, name: "John Doe", email: "john.doe@example.com", role: "admin" });
        }),
      ],
    },
  },
};
