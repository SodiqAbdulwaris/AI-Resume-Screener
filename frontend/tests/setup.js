import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia — anything using ThemeContext (which
// reads prefers-color-scheme as its light/dark fallback) needs this stubbed.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
