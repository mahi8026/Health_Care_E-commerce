import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// ── localStorage mock ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (key) => store[key] ?? null,
    setItem:    (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear:      () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => localStorageMock.clear());

describe('useLocalStorage', () => {
  it('returns the initial value when key is not set', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads an existing value from localStorage', () => {
    localStorageMock.setItem('existing', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('existing', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('sets a new value and persists it', () => {
    const { result } = renderHook(() => useLocalStorage('key1', 0));
    act(() => { result.current[1](42); });
    expect(result.current[0]).toBe(42);
    expect(JSON.parse(localStorageMock.getItem('key1'))).toBe(42);
  });

  it('accepts a functional updater', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 10));
    act(() => { result.current[1](prev => prev + 5); });
    expect(result.current[0]).toBe(15);
  });

  it('removes the value and resets to initial', () => {
    const { result } = renderHook(() => useLocalStorage('toRemove', 'init'));
    act(() => { result.current[1]('changed'); });
    act(() => { result.current[2](); });
    expect(result.current[0]).toBe('init');
    expect(localStorageMock.getItem('toRemove')).toBeNull();
  });

  it('stores and retrieves object values', () => {
    const { result } = renderHook(() => useLocalStorage('obj', null));
    const data = { name: 'Mediport', items: [1, 2, 3] };
    act(() => { result.current[1](data); });
    expect(result.current[0]).toEqual(data);
  });

  it('returns [storedValue, setValue, removeValue] tuple', () => {
    const { result } = renderHook(() => useLocalStorage('tuple', 'x'));
    expect(result.current).toHaveLength(3);
    expect(typeof result.current[1]).toBe('function');
    expect(typeof result.current[2]).toBe('function');
  });
});
