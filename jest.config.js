module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'pages/api/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/']
}; 