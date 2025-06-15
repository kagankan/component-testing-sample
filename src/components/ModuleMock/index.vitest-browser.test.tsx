import { expect, test , vi, describe } from "vitest";
import { render } from "vitest-browser-react";
import { ModuleMockSample } from ".";
import { someFunction } from "./sample-module";

// ✅️ モジュールモックできる
// ⚠️ ただし、watchモードで再実行するとモックされなくなる模様？？（初回実行はうまくいく）
vi.mock("./sample-module", async () => {
  const original = await vi.importActual("./sample-module");
  return {
    ...original,
    someFunction: vi.fn().mockReturnValue("mocked"),
  };
});

describe("モジュールモック", () => {
  test("モジュールモック", async () => {
    render(<ModuleMockSample />);

    expect(someFunction).toHaveBeenCalled();
  });
});
