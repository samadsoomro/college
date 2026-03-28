import { useState, useEffect, useRef } from 'react';

export function useCountUp(
  target: number,
  duration: number = 2000,
  isVisible: boolean = false
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number | null = null;
    const start = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic for smooth deceleration:
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * (target - start) + start));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(target);
    };

    requestAnimationFrame(animate);
  }, [isVisible, target, duration]);

  return count;
}
