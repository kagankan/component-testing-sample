import { expect, test } from "@playwright/experimental-ct-react";
import { http, HttpResponse } from "msw";
import { SampleForm } from ".";

test("フォームの操作とAPI呼び出しのテスト", async ({ mount, router }) => {
  let getCallCount = 0;
  let putCallData: unknown = null;

  // APIハンドラーの設定
  await router.use(
    http.get("/api/users/1", () => {
      getCallCount++;
      return HttpResponse.json({
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        role: "admin",
      });
    }),
    http.put("/api/users/1", async ({ request }) => {
      const body = await request.json();
      putCallData = body;
      return HttpResponse.json(body);
    })
  );

  let onErrorMockValue: string | undefined;
  const onErrorMock = (value: string) => {
    onErrorMockValue = value;
  };

  const component = await mount(
    <SampleForm userId={1} onError={onErrorMock} />
  );

  // ユーザー情報が取得されて表示されることを確認
  await expect(component.getByText("John Doe")).toBeVisible({ timeout: 5000 });

  // GETリクエストが呼び出されたことを確認
  expect(getCallCount).toBeGreaterThan(0);
  expect(onErrorMockValue).toBeUndefined();

  // フォームの操作
  await component.getByRole("textbox", { name: "名前" }).fill("");
  await component.getByRole("textbox", { name: "名前" }).fill("Taro");

  await component.getByRole("textbox", { name: "メールアドレス" }).fill("");
  await component
    .getByRole("textbox", { name: "メールアドレス" })
    .fill("taro@example.com");

  await component.getByRole("combobox", { name: "役割" }).selectOption("admin");

  await component.getByRole("button", { name: "保存" }).click();

  // 少し待機してPUTリクエストが完了するのを確認
  await component.page().waitForTimeout(1000);

  // PUTリクエストが正しいデータで呼び出されたことを確認
  expect(putCallData).toEqual({
    id: 1,
    name: "Taro",
    email: "taro@example.com",
    role: "admin",
  });
});

