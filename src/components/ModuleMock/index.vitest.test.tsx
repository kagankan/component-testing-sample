import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ModuleMockSample } from ".";
import { someFunction } from "./sample-module";

// ✅️ モジュールモックできる
vi.mock("./sample-module", async () => {
  const original = await vi.importActual("./sample-module");
  return {
    ...original,
    someFunction: vi.fn().mockReturnValue("mocked"),
  };
});

describe("モジュールモック", () => {
  it("モジュールモック", async () => {
    render(<ModuleMockSample />);

    expect(someFunction).toHaveBeenCalled();
  });
});
