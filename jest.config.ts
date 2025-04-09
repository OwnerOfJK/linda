module.exports = {
  preset: 'jest-expo',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-router|expo(nent)?|@expo|expo-modules-core|react-native|@react-native|react-navigation)/)',
  ],
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
};
