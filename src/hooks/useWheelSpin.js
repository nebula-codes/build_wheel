import { useState, useCallback, useRef, useEffect } from 'react';

// Spin configuration constants
const MIN_ROTATIONS = 3;
const MAX_EXTRA_ROTATIONS = 3;
const SPIN_DURATION_MS = 4000;
const BASE_TICK_DELAY_MS = 50;
const MAX_TICK_DELAY_MS = 300;

export function useWheelSpin(items, onComplete, onTick) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const animationRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const itemsRef = useRef(items);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // Keep refs updated
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const spin = useCallback(() => {
    const currentItems = itemsRef.current;
    if (isSpinning || currentItems.length === 0) return;

    setIsSpinning(true);
    setSelectedItem(null);

    const fullRotations = MIN_ROTATIONS + Math.floor(Math.random() * MAX_EXTRA_ROTATIONS);
    const randomSegment = Math.floor(Math.random() * currentItems.length);
    const segmentAngle = 360 / currentItems.length;

    // In the wheel SVG, segment 0 starts at -90° (top) and goes clockwise
    // Segment K's middle is at angle: -90 + K*segmentAngle + segmentAngle/2
    // When we rotate the wheel by R degrees, that segment moves clockwise by R
    // For segment K to be at the top (pointer at -90°), we need:
    // rotation % 360 = 360 - (K * segmentAngle + segmentAngle/2) for segment K's middle at top

    const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.4;
    const segmentMiddleOffset = randomSegment * segmentAngle + segmentAngle / 2;
    const targetAngleMod360 = (360 - segmentMiddleOffset + 360) % 360;

    // Calculate new rotation: start from current, add full spins, land on target
    // We need final rotation % 360 = targetAngleMod360
    const currentMod360 = ((rotation % 360) + 360) % 360;
    let additionalRotation = targetAngleMod360 - currentMod360;
    if (additionalRotation < 0) additionalRotation += 360;

    const newRotation = rotation + (fullRotations * 360) + additionalRotation + randomOffset;

    setRotation(newRotation);

    // Store the selected item for the callback
    const selectedItemForCallback = currentItems[randomSegment];

    // Start tick sounds during spin (simulate wheel clicking past segments)
    // Use exponential slowdown to match the easing curve
    if (onTickRef.current) {
      let tickCount = 0;
      const maxTicks = 20 + Math.floor(Math.random() * 10); // 20-30 ticks
      const tick = () => {
        if (tickCount >= maxTicks) {
          if (tickIntervalRef.current) {
            clearTimeout(tickIntervalRef.current);
            tickIntervalRef.current = null;
          }
          return;
        }
        onTickRef.current();
        tickCount++;
        // Exponentially increase interval (start fast, slow down)
        const delay = BASE_TICK_DELAY_MS + Math.pow(tickCount / maxTicks, 2) * MAX_TICK_DELAY_MS;
        tickIntervalRef.current = setTimeout(tick, delay);
      };
      tickIntervalRef.current = setTimeout(tick, 100);
    }

    // Set timeout to match CSS transition duration
    animationRef.current = setTimeout(() => {
      setIsSpinning(false);
      setSelectedItem(selectedItemForCallback);
      // Clear any remaining tick timers
      if (tickIntervalRef.current) {
        clearTimeout(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      if (onCompleteRef.current) {
        onCompleteRef.current(selectedItemForCallback);
      }
    }, SPIN_DURATION_MS); // Match CSS transition duration

    return randomSegment;
  }, [isSpinning, rotation]);

  const reset = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    if (tickIntervalRef.current) {
      clearTimeout(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    setRotation(0);
    setIsSpinning(false);
    setSelectedItem(null);
  }, []);

  return {
    rotation,
    isSpinning,
    selectedItem,
    spin,
    reset,
  };
}
