import { expect, test as testBase, vi, beforeEach, describe } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "@vitest/browser/context";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { SampleForm } from ".";

const worker = setupWorker();

// Vitest Browser モードで MSW を使用するための設定
// https://mswjs.io/docs/recipes/vitest-browser-mode/
const test = testBase.extend<{
  worker: typeof worker;
}>({
  worker: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      // Start the worker before the test.
      await worker.start();

      // Expose the worker object on the test's context.
      await use(worker);

      // ↓これが推奨されていたが、使用される前にリセットされてしまうため、消している
      // Remove any request handlers added in individual test cases.
      // This prevents them from affecting unrelated tests.
      // worker.resetHandlers();
    },
    { auto: true },
  ],
});

// ⚠️ window.alert, window.confirm などは進行不能になるためモックが必要
// https://vitest.dev/guide/browser/#thread-blocking-dialogs
const alertMock = vi.fn();
vi.stubGlobal("alert", alertMock);

const getCallMock = vi.fn();
const putCallMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // ✅️ MSW で API モックが可能
  worker.use(
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
    })
  );
});

describe("APIモック・モック関数", () => {
  test("データ取得と表示", async () => {
    const screen = render(<SampleForm userId={1} />);

    // ユーザー情報が表示されることを確認
    await expect.element(screen.getByText("Sample User")).toBeVisible();
    await expect
      .element(screen.getByText("sample.user@example.com"))
      .toBeVisible();
    await expect.element(screen.getByText("viewer")).toBeVisible();

    // GETリクエストが呼び出されたことを確認
    expect(getCallMock).toHaveBeenCalled();
  });

  test("APIモックの上書き", async ({ worker }) => {
    worker.use(
      // ✅️ テストケースごとにモックを設定することができる
      http.get("/api/users/1", () => {
        return HttpResponse.json(
          { message: "見せられないよ！" },
          { status: 403 }
        );
      })
    );

    const onErrorMock = vi.fn();

    render(<SampleForm userId={1} onError={onErrorMock} />);

    await vi.waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith("見せられないよ！");
    });
  });

  test("フォーム操作とデータ更新", async () => {
    const onErrorMock = vi.fn();

    const screen = render(<SampleForm userId={1} onError={onErrorMock} />);

    // ✅️ ARIA ロールとアクセシブル名を使ってフォームの操作を実行できる
    await screen.getByRole("textbox", { name: "名前" }).fill("Taro");
    await screen
      .getByRole("textbox", { name: "メールアドレス" })
      .fill("taro@example.com");
    await screen.getByRole("combobox", { name: "役割" }).selectOptions("admin");
    await screen.getByRole("button", { name: "保存" }).click();

    // 少し待機してPUTリクエストが完了するのを確認
    await vi.waitFor(() => {
      // PUTリクエストが正しいデータで呼び出されたことを確認
      expect(putCallMock).toHaveBeenCalledWith({
        name: "Taro",
        email: "taro@example.com",
        role: "admin",
      });
      expect(onErrorMock).not.toHaveBeenCalled();
    });
  });

  test("アラートの表示", async () => {
    const screen = render(<SampleForm userId={1} />);

    await screen.getByRole("button", { name: "保存" }).click();

    expect(alertMock).toHaveBeenCalledWith("名前を入力してください");
  });
});

describe("ブラウザ固有の機能", () => {
  describe("画面サイズ", () => {
    test("狭いとき", async () => {
      // ✅️ ビューポートのサイズを指定してテストが可能
      page.viewport(375, 667);

      const screen = render(<SampleForm userId={1} />);

      await expect
        .element(screen.getByText("これは画面が狭いときだけ表示されるはずだよ"))
        .toBeVisible();
    });

    test("広いとき", async () => {
      page.viewport(1024, 768);

      const screen = render(<SampleForm userId={1} />);

      await expect
        .element(screen.getByText("これは画面が狭いときだけ表示されるはずだよ"))
        .not.toBeInTheDocument(); // 存在しないことのテストは not.toBeInTheDocument を使う
    });
  });

  test("スクロール", async () => {
    const screen = render(<SampleForm userId={1} />);

    // ✅️ ブラウザで実行するので window.scrollTo が実行できる
    await screen.getByRole("button", { name: "一番下へスクロール" }).click();

    // smoothスクロールなので少し待つ
    await vi.waitFor(async () => {
      // ✅️ ブラウザ上で実行されるので、テスト内でも window を参照可能
      expect(window.scrollY).toBeGreaterThan(100);
      await expect.element(screen.getByText("ここが一番下だよ")).toBeVisible();
    });
  });
});
