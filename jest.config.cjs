module.exports = {
  testEnvironment: "jest-fixed-jsdom",
  testMatch: ["**/*.jest.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
    "^.+\\.(css|scss)$": "jest-transform-stub",
  },
  preset: "ts-jest",
};
