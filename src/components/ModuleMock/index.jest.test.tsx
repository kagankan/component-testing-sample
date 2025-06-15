import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ModuleMockSample } from ".";

jest.mock("./sample-module", () => ({
  someFunction: jest.fn().mockReturnValue("mocked"),
}));

describe("モジュールモック", () => {
  it("モジュールモック", async () => {
    render(<ModuleMockSample />);
    // @ts-expect-error - 動作には影響しない
    await expect(screen.getByText("mocked")).toBeVisible();
  });
});
