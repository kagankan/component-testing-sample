import { expect, test } from "@playwright/experimental-ct-react";
import { ModuleMockSample } from ".";
import { vi } from "vitest";

vi.mock("./sample-module", () => ({
  someFunction: vi.fn().mockReturnValue("mocked"),
}));

test.describe("モジュールモック", () => {
  test("Playwright ではモジュールモックは不可能なはず", async ({ mount }) => {
    const component = await mount(<ModuleMockSample />);

    // 表示されているテキストを確認
    await expect(component.getByText("mocked")).toBeVisible();
  });
});
