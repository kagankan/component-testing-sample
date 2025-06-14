import type { Meta, StoryObj } from "@storybook/react-vite";
import { clearAllMocks, expect, fn, waitFor,  } from "storybook/test";
import { http, HttpResponse } from "msw";
import { SampleForm } from ".";

// https://zenn.dev/takepepe/articles/jest-msw-mocking を使おうとしてみたが、成功するときとしないときがあり、不安定だった
const mockGet = fn();
const mockPut = fn();

const meta = {
  component: SampleForm,
  parameters: {
    msw: {
      // MSW で API をモックできる
      handlers: [
        http.get("/api/users/1", () => {
          mockGet();
          return HttpResponse.json({
            id: 1,
            name: "John Doe",
            email: "john.doe@example.com",
            role: "admin",
          });
        }),
        http.put("/api/users/1", async ({ request }) => {
          const body = await request.json();
          console.log(body);
          mockPut(body);
          return HttpResponse.json(body);
        }),
      ],
    },
  },
} satisfies Meta<typeof SampleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userId: 1,
    onError: fn(),
  },

  beforeEach: () => {
    clearAllMocks();
  },
  play: async ({ canvas , userEvent}) => {
    await waitFor(async () => {
      await expect(await canvas.findByText("John Doe")).toBeVisible();
      // 成功するときとしないときがあり、不安定
      await expect(mockGet).toHaveBeenCalled();

  }, {
    timeout: 5000,
  });

    
    await userEvent.clear(canvas.getByRole("textbox", { name: "名前" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "名前" }), "Taro");
    
    await userEvent.clear(canvas.getByRole("textbox", { name: "メールアドレス" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "メールアドレス" }), "taro@example.com");
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "役割" }), "admin");
    await userEvent.click(canvas.getByRole("button", { name: "保存" }));

    // ブラウザ上で実行するため、window参照可能
    expect(window.scrollY).toBeGreaterThan(100);

          // 成功するときとしないときがあり、不安定
    await expect(mockPut).toHaveBeenCalledWith({
      id: 1,
      name: "Taro",
      email: "taro@example.com",
      role: "admin",
    });

  },
};
