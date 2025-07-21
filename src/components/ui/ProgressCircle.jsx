'use client';

import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
/**
 * A reusable and dynamic radial progress circle component for React.
 * @param {object} props - The component props.
 * @param {number} props.progressValue - The progress percentage (0-100).
 * @param {string} props.progressColor - The color of the progress ring.
 * @param {number} [props.size=250] - The size (width and height) of the component in pixels.
 */
const ProgressCircle = ({ progressValue, progressColor, size = 250 }) => {
  // --- SSR Safety Check ---
  // Ensure props are valid numbers before using them in calculations to prevent NaN errors during server-side rendering.
  const validProgress = typeof progressValue === 'number' ? progressValue : 0;
  const validSize = typeof size === 'number' ? size : 250;

  // --- Component State ---

  // State to manage the visibility and fade-out animation
  const [isVisible, setIsVisible] = useState(false);

  // --- Constants and Memoized Values ---

  // All calculations are now derived from the validated 'validSize' prop to make the component dynamic and SSR-safe.
  const viewBoxSize = validSize;
  const strokeWidth = validSize / 2; // Stroke is half the size to fill from the center
  const radius = validSize / 4; // The ring's radius is a quarter of the total size

  // Memoize circumference calculation to avoid re-calculating on every render unless radius changes
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  // Calculate the stroke offset based on the validated progress value
  const strokeDashoffset =
    circumference - (validProgress / 100) * circumference;

  // --- Effects ---

  // Effect to handle the fade-in and fade-out animations based on progressValue
  useEffect(() => {
    let isMounted = true;

    if (validProgress > 0 && validProgress < 100) {
      setIsVisible(true);
    } else if (validProgress >= 100) {
      const fadeOutTimer = setTimeout(() => {
        if (isMounted) setIsVisible(false);
      }, 500);
      return () => clearTimeout(fadeOutTimer);
    } else {
      // progressValue is 0
      setIsVisible(false);
    }

    return () => {
      isMounted = false;
    };
  }, [validProgress]);

  // --- Render ---

  return (
    // The container div's dimensions are now set dynamically using inline styles
    <div
      className={`relative mx-auto transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      style={{ width: validSize, height: validSize }}
    >
      <svg
        width='100%'
        height='100%'
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        {/* Background Circle */}
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={validSize / 2} // Background radius is half the total size
          fill='transparent'
        />

        {/* Foreground (Progress) Ring */}
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={radius}
          fill='none'
          className={cn('stroke-current', progressColor)}
          // stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.35s ease-out',
          }}
        />
      </svg>
    </div>
  );
};

ProgressCircle.displayName = 'ProgressCircle';

export default ProgressCircle;
