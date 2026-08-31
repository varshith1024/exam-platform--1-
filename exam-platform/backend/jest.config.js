module.exports = {
  testEnvironment: "node",
  clearMocks: true,

  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  testTimeout: 15000,
};