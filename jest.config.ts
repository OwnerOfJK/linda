import type { Config } from 'jest';

export default async (): Promise<Config> => {
  return {
    verbose: true,
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    preset: 'react-native',
  };
};