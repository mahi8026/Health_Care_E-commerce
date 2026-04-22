// health-care/jest.setup.js
import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder (needed for backend tests with supertest)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
