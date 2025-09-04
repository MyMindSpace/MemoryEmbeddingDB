// Global test setup
require('dotenv').config({ path: '.env.test' });

// Set test environment variables if not set
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3001';
process.env.API_KEY = process.env.API_KEY || 'test-api-key';

// Mock console.log during tests to reduce noise
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}
