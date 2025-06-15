import { expect, test } from "@playwright/experimental-ct-react";
import { ModuleMockSample } from ".";

test.describe("モジュールモック", () => {
  // ❌️ Playwright ではモジュールモックは不可能
  test("モジュールモックは不可能", async ({ mount }) => {
    const component = await mount(<ModuleMockSample />);

    // 表示されているテキストを確認
    // await expect(component.getByText("mocked")).toBeVisible();
    await expect(component.getByText("original")).toBeVisible();
  });
});
