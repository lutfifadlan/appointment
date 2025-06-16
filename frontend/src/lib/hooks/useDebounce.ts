import { useCallback, useRef } from 'react';

export function useDebounce<T extends (event: React.MouseEvent<HTMLDivElement>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(event);
      }, delay);
    },
    [callback, delay]
  ) as T;
} 