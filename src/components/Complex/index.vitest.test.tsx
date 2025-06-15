import {
  describe,
  expect,
  it,
  vi,
  beforeAll,
  afterEach,
  afterAll,
  beforeEach,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { SampleForm } from ".";

// ⚠️ Node 上で実行するため、ブラウザのみに存在する関数はモックする必要がある
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const server = setupServer();

beforeAll(() => {
  server.listen();
});

const getCallMock = vi.fn();
const putCallMock = vi.fn();

beforeEach(() => {
  // ✅️ MSW で API モックが可能
  server.use(
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

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

describe("APIモック・モック関数", () => {
  it("データ取得と表示", async () => {
    render(<SampleForm userId={1} onError={vi.fn()} />);

    // ユーザー情報が表示されることを確認
    expect(await screen.findByText("Sample User")).toBeVisible();
    expect(await screen.findByText("sample.user@example.com")).toBeVisible();
    expect(await screen.findByText("viewer")).toBeVisible();

    // GETリクエストが呼び出されたことを確認
    expect(getCallMock).toHaveBeenCalled();
  });

  it("APIモックの上書き", async () => {
    server.use(
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

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith("見せられないよ！");
    });
  });

  it("フォームの操作とデータ更新", async () => {
    const onErrorMock = vi.fn();
    const user = userEvent.setup();

    render(<SampleForm userId={1} onError={onErrorMock} />);

    // ✅️ ARIA ロールとアクセシブル名を使ってフォームの操作を実行できる
    await user.type(screen.getByRole("textbox", { name: "名前" }), "Taro");
    await user.type(
      screen.getByRole("textbox", { name: "メールアドレス" }),
      "taro@example.com"
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "役割" }),
      "admin"
    );
    await user.click(screen.getByRole("button", { name: "保存" }));

    // 少し待機してPUTリクエストが完了するのを確認
    await waitFor(() => {
      expect(putCallMock).toHaveBeenCalledWith({
        name: "Taro",
        email: "taro@example.com",
        role: "admin",
      });
    });
  });

  it("アラートの表示", async () => {
    // window.alert をモック
    const alertSpy = vi.spyOn(window, "alert");
    const user = userEvent.setup();

    render(<SampleForm userId={1} />);

    // 何も入力せず保存しようとする
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(alertSpy).toHaveBeenCalledWith("名前を入力してください");
  });
});

describe("ブラウザ固有の機能", () => {
  describe("画面サイズ", () => {
    it("狭いとき", async () => {
      render(<SampleForm userId={1} />);
      // ❌️ jsdom では再現できないため、テストが失敗する
      // expect(
      //   screen.queryByText("これは画面が狭いときだけ表示されるはずだよ")
      // ).toBeVisible();
    });

    it("広いとき", async () => {
      render(<SampleForm userId={1} />);
      expect(
        screen.queryByText("これは画面が狭いときだけ表示されるはずだよ")
      ).not.toBeInTheDocument();
    });
  });

  it("スクロール", async () => {
    render(<SampleForm userId={1} />);

    // ✅️ window.scrollTo がモックされているので実行はできる
    // ただし `Error: Not implemented: window.scrollTo` というエラーが出る
    const scrollButton = screen.getByRole("button", {
      name: "一番下へスクロール",
    });
    await userEvent.click(scrollButton);

    await vi.waitFor(async () => {
      // ❌️ スクロールすることができないので、テストしようとしても失敗する
      // await expect.element(screen.getByText("ここが一番下だよ")).toBeVisible();
    });
  });
});
