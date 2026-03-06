import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardMode } from './useDashboardMode';

const STORAGE_KEY = 'kollektivt:dashboard';

// Create a simple localStorage mock since jsdom localStorage is limited
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const key in store) delete store[key]; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useDashboardMode', () => {
  beforeEach(() => {
    for (const key in store) delete store[key];
    vi.clearAllMocks();
  });

  it('defaults to false when localStorage is empty', () => {
    const { result } = renderHook(() => useDashboardMode());
    expect(result.current.dashboard).toBe(false);
  });

  it('reads true from localStorage', () => {
    localStorage.setItem('kollektivt:dashboard', 'true');
    const { result } = renderHook(() => useDashboardMode());
    expect(result.current.dashboard).toBe(true);
  });

  it('toggle flips state and persists to localStorage', () => {
    const { result } = renderHook(() => useDashboardMode());
    expect(result.current.dashboard).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.dashboard).toBe(true);
    expect(localStorage.getItem('kollektivt:dashboard')).toBe('true');

    act(() => {
      result.current.toggle();
    });

    expect(result.current.dashboard).toBe(false);
    expect(localStorage.getItem('kollektivt:dashboard')).toBe('false');
  });
});
