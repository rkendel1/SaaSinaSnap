// Jest setup file for tests
import 'jest';

// Global test setup can go here
global.console = {
  ...console,
  // Suppress console.debug in tests unless needed
  debug: jest.fn(),
};