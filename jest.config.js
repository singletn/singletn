module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: { '\\.ts$': ['ts-jest'] },
  setupFiles: ['jest-localstorage-mock', 'fake-indexeddb', 'raf/polyfill'],
  modulePathIgnorePatterns: ['<rootDir>/demos', '<rootDir>/dist'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/packages/core/dist',
    '<rootDir>/packages/react-singletn/dist',
    '<rootDir>/packages/local-storage/dist',
    '<rootDir>/packages/indexeddb/dist',
    '<rootDir>/packages/demo',
    '<rootDir>/packages/chrome-extension',
  ],
}
