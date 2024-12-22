module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',
  testRegex: '__tests__/.*\\.ts$',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  // setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
};