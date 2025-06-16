import { motion } from "motion/react";
import { IconCursorOff } from "@tabler/icons-react";

interface CollaborativeCursorProps {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

export function CollaborativeCursor({
  userId,
  userName,
  x,
  y,
  color,
}: CollaborativeCursorProps) {
  return (
    <motion.div
      key={userId}
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <IconCursorOff
        className="h-5 w-5"
        style={{ color }}
      />
      <span
        className="text-xs"
        style={{ color }}
      >
        {userName}
      </span>
    </motion.div>
  );
} 