import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'changed', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('changed');
  });

  it('should cancel previous timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    act(() => { jest.advanceTimersByTime(100); });
    rerender({ value: 'third' });
    act(() => { jest.advanceTimersByTime(100); });

    // Should still be 'first' because neither 300 ms window has elapsed
    expect(result.current).toBe('first');

    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe('third');
  });

  it('should handle numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });
    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe(42);
  });

  it('should use default 300ms delay when delay argument is omitted', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => { jest.advanceTimersByTime(299); });
    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('b');
  });
});
