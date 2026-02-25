import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWheelSpin } from '../useWheelSpin';

describe('useWheelSpin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const testItems = [
    { id: 1, name: 'Item A' },
    { id: 2, name: 'Item B' },
    { id: 3, name: 'Item C' },
  ];

  it('initializes with default state', () => {
    const { result } = renderHook(() => useWheelSpin(testItems));
    expect(result.current.rotation).toBe(0);
    expect(result.current.isSpinning).toBe(false);
    expect(result.current.selectedItem).toBeNull();
  });

  it('starts spinning on spin()', () => {
    const { result } = renderHook(() => useWheelSpin(testItems));
    act(() => {
      result.current.spin();
    });
    expect(result.current.isSpinning).toBe(true);
    expect(result.current.rotation).toBeGreaterThan(0);
  });

  it('prevents double spin', () => {
    const { result } = renderHook(() => useWheelSpin(testItems));
    act(() => {
      result.current.spin();
    });
    const firstRotation = result.current.rotation;
    act(() => {
      result.current.spin(); // Should be ignored
    });
    expect(result.current.rotation).toBe(firstRotation);
  });

  it('does nothing with empty items', () => {
    const { result } = renderHook(() => useWheelSpin([]));
    act(() => {
      result.current.spin();
    });
    expect(result.current.isSpinning).toBe(false);
    expect(result.current.rotation).toBe(0);
  });

  it('completes after 4 seconds and selects an item', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useWheelSpin(testItems, onComplete));

    act(() => {
      result.current.spin();
    });
    expect(result.current.isSpinning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.isSpinning).toBe(false);
    expect(result.current.selectedItem).not.toBeNull();
    expect(testItems).toContainEqual(result.current.selectedItem);
    expect(onComplete).toHaveBeenCalledWith(result.current.selectedItem);
  });

  it('calls onTick during spin', () => {
    const onTick = vi.fn();
    const { result } = renderHook(() => useWheelSpin(testItems, undefined, onTick));

    act(() => {
      result.current.spin();
    });

    // Advance through tick timers
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onTick).toHaveBeenCalled();
  });

  it('resets state correctly', () => {
    const { result } = renderHook(() => useWheelSpin(testItems));

    act(() => {
      result.current.spin();
    });
    expect(result.current.isSpinning).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.rotation).toBe(0);
    expect(result.current.isSpinning).toBe(false);
    expect(result.current.selectedItem).toBeNull();
  });

  it('can spin again after completion', () => {
    const { result } = renderHook(() => useWheelSpin(testItems));

    // First spin
    act(() => {
      result.current.spin();
    });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.isSpinning).toBe(false);

    // Second spin
    act(() => {
      result.current.spin();
    });
    expect(result.current.isSpinning).toBe(true);
    expect(result.current.rotation).toBeGreaterThan(0);
  });

  it('returns segment index from spin()', () => {
    const { result } = renderHook(() => useWheelSpin(testItems));
    let segmentIndex;
    act(() => {
      segmentIndex = result.current.spin();
    });
    expect(segmentIndex).toBeGreaterThanOrEqual(0);
    expect(segmentIndex).toBeLessThan(testItems.length);
  });

  it('rotation always increases with each spin', () => {
    const { result } = renderHook(() => useWheelSpin(testItems));

    act(() => {
      result.current.spin();
    });
    const firstRotation = result.current.rotation;

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    act(() => {
      result.current.spin();
    });
    expect(result.current.rotation).toBeGreaterThan(firstRotation);
  });
});
