import type { Meta, StoryObj } from "@storybook/react-vite";
import { clearAllMocks, expect, fn, waitFor } from "storybook/test";
import { http, HttpResponse } from "msw";
import { SampleForm } from ".";

// https://zenn.dev/takepepe/articles/jest-msw-mocking を使おうとしてみたが、成功するときとしないときがあり、不安定だった
const getCallMock = fn();
const putCallMock = fn();

const meta = {
  component: SampleForm,
  parameters: {
    msw: {
      // ✅️ MSW で API モックが可能
      handlers: [
        http.get("/api/users/1", () => {
          // ✅️ モック関数を使うことで呼び出し履歴をテストできる
          // https://zenn.dev/takepepe/articles/jest-msw-mocking
          getCallMock();
          return HttpResponse.json({
            id: 1,
            name: "Sample User",
            email: "sample.user@example.com",
            role: "viewer",
          });
        }),
        http.put("/api/users/1", async ({ request }) => {
          const body = await request.json();
          putCallMock(body);
          return HttpResponse.json(body);
        }),
      ],
    },
    test: {
      // ⚠️ Uncaught TypeError: Cannot read properties of undefined (reading 'url') のエラーが出るケースあり、不安定
      // このパラメータで無視できるが、あまりよくない
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
} satisfies Meta<typeof SampleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const データ取得と表示: Story = {
  args: {
    userId: 1,
    onError: fn(),
  },
  beforeEach: () => {
    clearAllMocks();
  },
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("Sample User")).toBeVisible();
      await expect(canvas.getByText("sample.user@example.com")).toBeVisible();
      await expect(canvas.getByText("viewer")).toBeVisible();

      // GETリクエストが呼び出されたことを確認
      await expect(getCallMock).toHaveBeenCalled();
    });
  },
};

export const APIモックの上書き: Story = {
  args: {
    userId: 1,
    onError: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/users/1", () => {
          return HttpResponse.json(
            { message: "見せられないよ！" },
            { status: 403 }
          );
        }),
      ],
    },
  },
  beforeEach: () => {
    clearAllMocks();
  },
  play: async ({ args }) => {
    await waitFor(async () => {
      await expect(args.onError).toHaveBeenCalledWith("見せられないよ！");
    });
  },
};

export const フォーム操作とデータ更新: Story = {
  args: {
    userId: 1,
    onError: fn(),
  },

  beforeEach: () => {
    clearAllMocks();
  },
  play: async ({ canvas, userEvent }) => {
    await waitFor(async () => {
      await expect(canvas.getByText("Sample User")).toBeVisible();
      await expect(getCallMock).toHaveBeenCalled();
    });

    const user = userEvent.setup({});

    // ✅️ ARIA ロールとアクセシブル名を使ってフォームの操作を実行できる
    await user.type(canvas.getByRole("textbox", { name: "名前" }), "Taro");
    await user.type(
      canvas.getByRole("textbox", { name: "メールアドレス" }),
      "taro@example.com"
    );
    await user.selectOptions(
      canvas.getByRole("combobox", { name: "役割" }),
      "admin"
    );
    await user.click(canvas.getByRole("button", { name: "保存" }));

    // ⚠️ 成功するときとしないときがあり、不安定
    await expect(putCallMock).toHaveBeenCalledWith({
      name: "Taro",
      email: "taro@example.com",
      role: "admin",
    });
  },
};

export const アラートの表示: Story = {
  args: {
    userId: 1,
    onError: fn(),
  },

  beforeEach: () => {
    clearAllMocks();
    window.alert = fn(); // https://zenn.dev/codeciao/articles/55cc614d3ecf65
  },
  play: async ({ canvas, userEvent }) => {
    const user = userEvent.setup({});

    await user.click(canvas.getByRole("button", { name: "保存" }));

    await expect(window.alert).toHaveBeenCalledWith("名前を入力してください");
  },
};

// ブラウザ固有の機能
export const 画面サイズ_狭い: Story = {
  args: {
    userId: 1,
  },
  globals: {
    // ✅️ viewport を設定することで画面サイズを変更できる
    // （Storybook 9 から指定方法が変更されている）
    // https://storybook.js.org/docs/essentials/viewport
    viewport: { value: "mobile1" },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("これは画面が狭いときだけ表示されるはずだよ")
    ).toBeVisible();
  },
};

export const 画面サイズ_広い: Story = {
  args: {
    userId: 1,
  },
  globals: {
    viewport: { value: "tablet" },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText("これは画面が狭いときだけ表示されるはずだよ")
    ).not.toBeInTheDocument();
  },
};

export const スクロール: Story = {
  args: {
    userId: 1,
  },
  play: async ({ canvas, userEvent }) => {
    // ✅️ ブラウザ上で実行するため、スクロール可能
    await userEvent.click(
      canvas.getByRole("button", { name: "一番下へスクロール" })
    );

    // smooth scroll が完了するのを待つ
    await waitFor(async () => {
      await expect(canvas.getByText("ここが一番下だよ。")).toBeVisible();
      // ✅️ ブラウザ上で実行するため、window参照可能
      expect(window.scrollY).toBeGreaterThan(100);
    });
  },
};
