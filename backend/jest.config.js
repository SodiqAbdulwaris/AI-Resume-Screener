module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/helpers/env.js'],
  testTimeout: 30000,
  // express-rate-limit's internal cleanup timer keeps the process alive after
  // the test run finishes; the pass/fail result itself is unaffected.
  forceExit: true,
};
