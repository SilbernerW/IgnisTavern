'use client';

import { useEffect, useRef, useState } from 'react';

interface StreamingTextProps {
  buffer: string;           // All text received so far
  isStreaming: boolean;     // Whether more text is expected
  baseSpeed?: number;       // Base ms per character (e.g. 30)
  className?: string;
  onDisplayComplete?: () => void;
}

/**
 * Smooth typewriter that adapts speed to keep up with the buffer.
 * - When buffer is only slightly ahead: normal speed (baseSpeed)
 * - When buffer has lots of backlog: speeds up proportionally
 * - When streaming ends: accelerates smoothly to finish
 * - Never jumps to full text — always types out
 */
export default function StreamingText({
  buffer,
  isStreaming,
  baseSpeed = 30,
  className = '',
  onDisplayComplete,
}: StreamingTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const prevBufferLenRef = useRef(0);
  const hasCompletedRef = useRef(false);

  // Reset when buffer shrinks (new message starts)
  useEffect(() => {
    if (buffer.length < prevBufferLenRef.current) {
      setDisplayedLength(0);
      hasCompletedRef.current = false;
    }
    prevBufferLenRef.current = buffer.length;
  }, [buffer.length]);

  // Clear completion flag when new streaming starts
  useEffect(() => {
    if (isStreaming) {
      hasCompletedRef.current = false;
    }
  }, [isStreaming]);

  // Main animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp;

      const remaining = buffer.length - displayedLength;

      if (remaining <= 0) {
        // Nothing to display — check if we're done
        if (!isStreaming && !hasCompletedRef.current && buffer.length > 0) {
          hasCompletedRef.current = true;
          onDisplayComplete?.();
        }
        // Keep polling if streaming might add more
        if (isStreaming) {
          rafRef.current = requestAnimationFrame(animate);
        }
        return;
      }

      // Adaptive speed calculation
      let speed = baseSpeed;

      if (remaining > 50) {
        // Lots of backlog — speed up significantly
        // The more backlog, the faster we go (down to ~2ms/char)
        speed = Math.max(2, baseSpeed * (50 / remaining));
      } else if (remaining > 20) {
        // Moderate backlog — moderate speedup
        speed = Math.max(5, baseSpeed * (20 / remaining));
      }

      // If streaming ended, we need to finish — but smoothly
      // Accelerate gradually instead of jumping
      if (!isStreaming) {
        // Ramp up speed: the more remaining, the faster
        // But never skip characters entirely
        speed = Math.max(1, Math.min(speed, baseSpeed * 0.3));
      }

      const elapsed = timestamp - lastTickRef.current;
      const charsToAdd = Math.max(1, Math.floor(elapsed / speed));

      if (elapsed >= speed) {
        lastTickRef.current = timestamp - (elapsed % speed);
        setDisplayedLength(prev => {
          const next = Math.min(prev + charsToAdd, buffer.length);
          return next;
        });
      }

      // Continue animation if there's more to display or stream
      rafRef.current = requestAnimationFrame(animate);
    };

    // Start if there's work to do
    if (displayedLength < buffer.length || isStreaming) {
      lastTickRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [buffer, isStreaming, displayedLength, baseSpeed, onDisplayComplete]);

  const displayText = buffer.slice(0, displayedLength);
  const isTyping = displayedLength < buffer.length;

  return (
    <span className={className}>
      {displayText}
      {isTyping && (
        <span className="inline-block w-0.5 h-[1.1em] bg-amber-400 ml-0.5 align-text-bottom animate-pulse" />
      )}
    </span>
  );
}
