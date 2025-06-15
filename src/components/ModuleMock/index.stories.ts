import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ModuleMockSample } from ".";
import { createMock } from 'storybook-addon-vite-mock';
import { someFunction} from "./sample-module";


const meta = {
  component: ModuleMockSample,
  parameters: {
    moduleMock: {
      // ✅️ モジュールモックできる
      // ⚠️ ただし、mswと同時に使用するとエラーになるため、このリポジトリでは無効化している
      mock: () => {
        const mock = createMock(someFunction);
        mock.mockReturnValue("mocked");
        return [mock];
      },
    },
  },
} satisfies Meta<typeof ModuleMockSample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const モジュールモック: Story = {
  play: async ({ canvas }) => {
    // await expect(canvas.getByText("mocked")).toBeVisible();
    await expect(canvas.getByText("original")).toBeVisible();
  },
};
