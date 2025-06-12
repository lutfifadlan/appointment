import { useState, useEffect } from 'react';

interface FollowingPointerOptions {
  throttleAmount?: number;
}

interface Position {
  x: number;
  y: number;
}

export function useFollowingPointer(options: FollowingPointerOptions = {}) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const { throttleAmount = 50 } = options;

  useEffect(() => {
    let lastUpdateTime = 0;
    
    const handlePointerMove = (e: PointerEvent) => {
      const currentTime = Date.now();
      
      // Throttle updates to avoid excessive re-renders
      if (currentTime - lastUpdateTime < throttleAmount) {
        return;
      }
      
      lastUpdateTime = currentTime;
      
      const { clientX, clientY } = e;
      setPosition({ x: clientX, y: clientY });
    };

    window.addEventListener('pointermove', handlePointerMove);
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [throttleAmount]);

  return position;
}
