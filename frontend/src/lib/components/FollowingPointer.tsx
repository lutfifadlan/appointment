import React from 'react';

export interface FollowingPointerProps {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

const FollowingPointer: React.FC<FollowingPointerProps> = ({
  userName,
  x,
  y,
  color
}) => {
  return (
    <div
      className="pointer-events-none fixed z-50 transition-transform"
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div className="relative">
        <div
          className="absolute -left-1 -top-1 h-3 w-3 rounded-full border-2 border-white"
          style={{ backgroundColor: color }}
        />
        <div className="absolute left-2 top-2 whitespace-nowrap rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-900 shadow-sm">
          {userName}
        </div>
      </div>
    </div>
  );
};

export default FollowingPointer;
