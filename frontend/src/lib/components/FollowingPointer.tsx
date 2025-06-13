import React from 'react';
import { motion } from 'framer-motion';

interface FollowingPointerProps {
  x: number;
  y: number;
  userName: string;
  color?: string;
}

export const FollowingPointer: React.FC<FollowingPointerProps> = ({ 
  x, 
  y, 
  userName,
  color = '#3b82f6' // Default blue color
}) => {
  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-50"
      animate={{ x, y }}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 200,
        mass: 0.5
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="white"
        />
      </svg>

      {/* User name tag */}
      <div
        className="absolute top-5 left-2 rounded-md px-2 py-1 text-xs font-medium text-white shadow-sm"
        style={{ backgroundColor: color, maxWidth: '150px' }}
      >
        <p className="truncate">{userName}</p>
      </div>
    </motion.div>
  );
};

export default FollowingPointer;
