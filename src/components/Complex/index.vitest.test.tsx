import {
  describe,
  expect,
  it,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { SampleForm } from ".";

// Node 上で実行するため、ブラウザのみに存在する関数はモックする
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// MSW サーバーのセットアップ
const server = setupServer();

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("SampleForm", () => {
  /**
   * @vitest-environment jsdom
   */
  it("フォームの操作とAPI呼び出しのテスト", async () => {
    const getCallMock = vi.fn();
    const putCallMock = vi.fn();

    // APIハンドラーの設定
    server.use(
      http.get("/api/users/1", () => {
        getCallMock();
        return HttpResponse.json({
          id: 1,
          name: "John Doe",
          email: "john.doe@example.com",
          role: "admin",
        });
      }),
      http.put("/api/users/1", async ({ request }) => {
        const body = await request.json();
        putCallMock(body);
        return HttpResponse.json(body);
      })
    );

    const onErrorMock = vi.fn();
    const user = userEvent.setup();

    render(<SampleForm userId={1} onError={onErrorMock} />);

    // ユーザー情報が取得されて表示されることを確認
    await waitFor(
      () => {
        expect(screen.getByText("John Doe")).toBeVisible();
      },
      { timeout: 5000 }
    );

    // GETリクエストが呼び出されたことを確認
    expect(getCallMock).toHaveBeenCalled();
    expect(onErrorMock).not.toHaveBeenCalled();

    // フォームの操作
    const nameInput = screen.getByRole("textbox", { name: "名前" });
    const emailInput = screen.getByRole("textbox", { name: "メールアドレス" });
    const roleSelect = screen.getByRole("combobox", { name: "役割" });
    const saveButton = screen.getByRole("button", { name: "保存" });

    await user.clear(nameInput);
    await user.type(nameInput, "Taro");

    await user.clear(emailInput);
    await user.type(emailInput, "taro@example.com");

    await user.selectOptions(roleSelect, "admin");
    await user.click(saveButton);

    // 少し待機してPUTリクエストが完了するのを確認
    await waitFor(
      () => {
        expect(putCallMock).toHaveBeenCalledWith({
          id: 1,
          name: "Taro",
          email: "taro@example.com",
          role: "admin",
        });
      },
      { timeout: 2000 }
    );
  });

  it("初期表示でユーザー情報が表示される", async () => {
    server.use(
      http.get("/api/users/1", () => {
        return HttpResponse.json({
          id: 1,
          name: "Jane Smith",
          email: "jane.smith@example.com",
          role: "user",
        });
      })
    );

    render(<SampleForm userId={1} onError={() => {}} />);

    // ユーザー情報が表示されることを確認
    await waitFor(
      () => {
        expect(screen.getByText("Jane Smith")).toBeVisible();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText("jane.smith@example.com")).toBeVisible();
    expect(screen.getByText("user")).toBeVisible();
  });

  it("フォームの必須項目が空の場合、保存ボタンが無効になる", async () => {
    server.use(
      http.get("/api/users/1", () => {
        return HttpResponse.json({
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "user",
        });
      })
    );

    const user = userEvent.setup();
    render(<SampleForm userId={1} onError={() => {}} />);

    // ユーザー情報が表示されるまで待機
    await waitFor(
      () => {
        expect(screen.getByText("Test User")).toBeVisible();
      },
      { timeout: 5000 }
    );

    const nameInput = screen.getByRole("textbox", { name: "名前" });
    const saveButton = screen.getByRole("button", { name: "保存" });

    // 名前フィールドをクリアすると保存ボタンが無効になることを確認
    await user.clear(nameInput);

    expect(saveButton).toBeDisabled();
  });

  it("APIエラー時の動作確認", async () => {
    server.use(
      http.get("/api/users/1", () => {
        return HttpResponse.error();
      })
    );

    // window.alert をモック
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const onErrorMock = vi.fn();

    render(<SampleForm userId={1} onError={onErrorMock} />);

    // エラーが発生してアラートが表示されることを確認
    await waitFor(
      () => {
        expect(alertSpy).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    alertSpy.mockRestore();
  });

  it("保存処理でエラーが発生した場合、onErrorが呼ばれる", async () => {
    server.use(
      http.get("/api/users/1", () => {
        return HttpResponse.json({
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "user",
        });
      }),
      http.put("/api/users/1", () => {
        return HttpResponse.error();
      })
    );

    const onErrorMock = vi.fn();
    const user = userEvent.setup();

    render(<SampleForm userId={1} onError={onErrorMock} />);

    // ユーザー情報が表示されるまで待機
    await waitFor(
      () => {
        expect(screen.getByText("Test User")).toBeVisible();
      },
      { timeout: 5000 }
    );

    // フォームに入力して保存
    const nameInput = screen.getByRole("textbox", { name: "名前" });
    const emailInput = screen.getByRole("textbox", { name: "メールアドレス" });
    const saveButton = screen.getByRole("button", { name: "保存" });

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    await user.clear(emailInput);
    await user.type(emailInput, "updated@example.com");

    await user.click(saveButton);

    // onErrorが呼ばれることを確認
    await waitFor(
      () => {
        expect(onErrorMock).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it("保存中は保存ボタンが無効になり、テキストが変わる", async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    const requestPromise = new Promise((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.get("/api/users/1", () => {
        return HttpResponse.json({
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "user",
        });
      }),
      http.put("/api/users/1", async ({ request }) => {
        const body = await request.json();
        // リクエストを遅延させる
        await requestPromise;
        return HttpResponse.json(body);
      })
    );

    const user = userEvent.setup();
    render(<SampleForm userId={1} onError={() => {}} />);

    // ユーザー情報が表示されるまで待機
    await waitFor(
      () => {
        expect(screen.getByText("Test User")).toBeVisible();
      },
      { timeout: 5000 }
    );

    // フォームに入力
    const nameInput = screen.getByRole("textbox", { name: "名前" });
    const emailInput = screen.getByRole("textbox", { name: "メールアドレス" });

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");

    await user.clear(emailInput);
    await user.type(emailInput, "updated@example.com");

    // 保存ボタンをクリック
    const saveButton = screen.getByRole("button", { name: "保存" });
    await user.click(saveButton);

    // 保存中の状態を確認
    expect(
      screen.getByRole("button", { name: "保存中..." })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();

    // リクエストを完了させる
    resolveRequest({
      id: 1,
      name: "Updated Name",
      email: "updated@example.com",
      role: "user",
    });

    // 保存が完了したら元の状態に戻ることを確認
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: "保存" })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("スクロールボタンをクリックする", async () => {
    render(<SampleForm userId={1} onError={() => {}} />);

    const scrollButton = screen.getByRole("button", { name: "一番下へスクロール" });
    await userEvent.click(scrollButton);

    // expect(scrollButton).toBeDisabled();
  });
});
