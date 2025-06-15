import { expect, test } from "@playwright/experimental-ct-react";
import { http, HttpResponse } from "msw";
import { SampleForm } from ".";

let getCallCount = 0;
let putCallData: unknown = null;

test.beforeEach(async ({ router }) => {
  // ✅️ MSW で API モックが可能
  await router.use(
    http.get("/api/users/1", () => {
      // ⚠️ 変数を使えば一応呼び出し回数のテストが可能
      getCallCount++;
      return HttpResponse.json({
        id: 1,
        name: "Sample User",
        email: "sample.user@example.com",
        role: "viewer",
      });
    }),
    http.put("/api/users/1", async ({ request }) => {
      const body = await request.json();
      putCallData = body;
      return HttpResponse.json(body);
    })
  );
});

test.afterEach(() => {
  getCallCount = 0;
  putCallData = null;
});

test.describe("APIリクエスト・モック関数", () => {
  test("データ取得と表示", async ({ mount }) => {
    const component = await mount(<SampleForm userId={1} />);

    // 表示されているテキストを確認
    await expect(component.getByText("Sample User")).toBeVisible();
    await expect(component.getByText("sample.user@example.com")).toBeVisible();
    await expect(component.getByText("viewer")).toBeVisible();

    // GETリクエストが呼び出されたことを確認
    expect(getCallCount).toBeGreaterThan(0);
  });

  test("APIモックの上書き", async ({ mount, router }) => {
    await router.use(
      http.get("/api/users/1", () => {
        return HttpResponse.json(
          { message: "見せられないよ！" },
          { status: 403 }
        );
      })
    );

    // ⚠️ コールバック関数をテストする場合は、変数を用意すれば可能
    let onErrorMockValue: string | undefined;
    const onErrorMock = (value: string) => {
      onErrorMockValue = value;
    };

    const component = await mount(
      <SampleForm userId={1} onError={onErrorMock} />
    );

    await component.page().waitForTimeout(500);
    expect(onErrorMockValue).toBe("見せられないよ！");
  });

  test("フォームの操作とデータ更新", async ({ mount }) => {
    let onErrorMockValue: string | undefined;
    const onErrorMock = (value: string) => {
      onErrorMockValue = value;
    };

    const component = await mount(
      <SampleForm userId={1} onError={onErrorMock} />
    );

    // ✅️ ARIA ロールとアクセシブル名を使ってフォームの操作を実行できる
    await component.getByRole("textbox", { name: "名前" }).fill("Taro");
    await component
      .getByRole("textbox", { name: "メールアドレス" })
      .fill("taro@example.com");
    await component
      .getByRole("combobox", { name: "役割" })
      .selectOption("admin");
    await component.getByRole("button", { name: "保存" }).click();

    // 少し待機してPUTリクエストが完了するのを確認
    await component.page().waitForTimeout(500);

    // PUTリクエストが正しいデータで呼び出されたことを確認
    expect(putCallData).toEqual({
      name: "Taro",
      email: "taro@example.com",
      role: "admin",
    });
    expect(onErrorMockValue).toBeUndefined();
  });

  test("アラートの表示", async ({ mount }) => {
    const component = await mount(<SampleForm userId={1} />);

    await component.getByRole("button", { name: "保存" }).click();

    // ❌️ window.alert のモックができないため、検証ができない
    // expect(alertMock).toHaveBeenCalledWith("名前を入力してください");
  });
});

test.describe("ブラウザ固有の機能", () => {
  test.describe("画面サイズ", () => {
    test("狭いとき", async ({ mount, page }) => {
      // ✅️ ビューポートのサイズを指定してテストが可能
      page.setViewportSize({ width: 375, height: 667 });
      const component = await mount(<SampleForm userId={1} />);

      await expect(
        component.getByText("これは画面が狭いときだけ表示されるはずだよ")
      ).toBeVisible();
    });
    test("広いとき", async ({ mount, page }) => {
      page.setViewportSize({ width: 1024, height: 768 });
      const component = await mount(<SampleForm userId={1} />);

      await expect(
        component.getByText("これは画面が狭いときだけ表示されるはずだよ")
      ).not.toBeVisible();
    });
  });

  test("スクロール", async ({ mount }) => {
    const component = await mount(<SampleForm userId={1} />);

    // ✅️ ブラウザで実行するので window.scrollTo が実行できる
    await component.getByRole("button", { name: "一番下へスクロール" }).click();

    await expect(component.getByText("ここが一番下だよ")).toBeVisible();
    // ❌️ テストは Node 上で実行されているので、window を参照できない
    // expect(window.scrollY).toBeGreaterThan(100);
  });
});
