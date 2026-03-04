import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Polyfill Element.animate for JSDOM
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
  Element.prototype.animate = vi.fn().mockReturnValue({
    finished: Promise.resolve(),
    cancel: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    reverse: vi.fn(),
    finish: vi.fn(),
  });
}