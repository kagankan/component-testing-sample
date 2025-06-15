
import { someFunction } from "./sample-module";

export const ModuleMockSample = () => {
  const result = someFunction();

  return (
    <div>
      <p>{result}</p>
    </div>
  );
};
