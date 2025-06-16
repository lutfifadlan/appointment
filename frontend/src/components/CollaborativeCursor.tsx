import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { motion, AnimatePresence } from 'framer-motion';

interface CursorPosition {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
  timestamp: number;
}

interface CollaborativeCursorProps {
  userId: string;
  userName: string;
  userColor: string;
  appointmentId: string;
  isEnabled?: boolean;
}

// Simple debounce hook
function useSimpleDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function CollaborativeCursor({ 
  userId, 
  userName, 
  userColor, 
  appointmentId,
  isEnabled = true 
}: CollaborativeCursorProps) {
  const { socket } = useWebSocket();
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Debounce cursor position to prevent spam
  const debouncedPosition = useSimpleDebounce(mousePosition, 50);

  // Rate limiting for cursor updates
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const UPDATE_THROTTLE = 50; // 50ms throttle

  const sanitizeInput = useCallback((data: unknown) => {
    // Basic input sanitization for WebSocket messages
    if (typeof data !== 'object' || !data || data === null) return null;
    
    const obj = data as Record<string, unknown>;
    
    return {
      x: typeof obj.x === 'number' && isFinite(obj.x) ? Math.max(0, Math.min(window.innerWidth, obj.x)) : 0,
      y: typeof obj.y === 'number' && isFinite(obj.y) ? Math.max(0, Math.min(window.innerHeight, obj.y)) : 0,
      userId: typeof obj.userId === 'string' ? obj.userId.slice(0, 50) : '',
      userName: typeof obj.userName === 'string' ? obj.userName.slice(0, 100) : '',
      color: typeof obj.color === 'string' && /^#[0-9A-F]{6}$/i.test(obj.color) ? obj.color : '#737373',
      timestamp: Date.now(),
    };
  }, []);

  useEffect(() => {
    if (!socket || !isEnabled) return;

    // Join the appointment room for cursor updates
    socket.emit('join-cursor-room', { appointmentId, userId, userName, color: userColor });

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdateTime < UPDATE_THROTTLE) return;
      
      setLastUpdateTime(now);
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleCursorUpdate = (data: unknown) => {
      const sanitizedData = sanitizeInput(data);
      if (!sanitizedData || sanitizedData.userId === userId) return;

      setCursors(prev => {
        const filtered = prev.filter(cursor => cursor.userId !== sanitizedData.userId);
        return [...filtered, sanitizedData];
      });

      // Remove stale cursors after 5 seconds
      setTimeout(() => {
        setCursors(prev => prev.filter(cursor => 
          cursor.userId !== sanitizedData.userId || 
          Date.now() - cursor.timestamp < 5000
        ));
      }, 5000);
    };

    const handleUserDisconnected = (data: { userId: string }) => {
      setCursors(prev => prev.filter(cursor => cursor.userId !== data.userId));
    };

    // Event listeners
    document.addEventListener('mousemove', handleMouseMove);
    socket.on('cursor-update', handleCursorUpdate);
    socket.on('user-disconnected', handleUserDisconnected);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('user-disconnected', handleUserDisconnected);
      socket.emit('leave-cursor-room', { appointmentId, userId });
    };
  }, [socket, userId, userName, userColor, appointmentId, isEnabled, lastUpdateTime, sanitizeInput]);

  // Send cursor position updates
  useEffect(() => {
    if (!socket || !isEnabled) return;

    socket.emit('cursor-move', {
      appointmentId,
      userId,
      userName,
      x: debouncedPosition.x,
      y: debouncedPosition.y,
      color: userColor,
      timestamp: Date.now(),
    });
  }, [debouncedPosition, socket, userId, userName, userColor, appointmentId, isEnabled]);

  // Clean up stale cursors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCursors(prev => prev.filter(cursor => Date.now() - cursor.timestamp < 10000));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!isEnabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.userId}
            className="absolute pointer-events-none"
            style={{
              left: cursor.x,
              top: cursor.y,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          >
            {/* Simple cursor display since FollowPointer expects motion values */}
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: cursor.color }}
            />
            <div
              className="absolute top-5 left-0 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.userName}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Visual indicator for active users */}
      {cursors.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg p-2 pointer-events-auto">
          <div className="text-xs text-muted-foreground mb-1">Active Users ({cursors.length})</div>
          <div className="flex gap-1">
            {cursors.slice(0, 5).map((cursor) => (
              <div
                key={cursor.userId}
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: cursor.color }}
                title={cursor.userName}
              />
            ))}
            {cursors.length > 5 && (
              <div className="text-xs text-muted-foreground ml-1">
                +{cursors.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 