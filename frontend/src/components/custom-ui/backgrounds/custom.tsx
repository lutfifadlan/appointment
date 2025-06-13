"use client";

import { DotPattern } from '@/components/magicui/dot-pattern'
import { cn } from '@/lib/utils'
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern'
import { useTheme } from "next-themes";
import { Particles } from '@/components/magicui/particles';

const defaultBackground = () => {
  return (
    <DotPattern
      width={20}
      height={20}
      cx={1}
      cy={1}
      cr={1}
      className={cn(
      "mt-1",
        "[mask-image:linear-gradient(to_bottom,white,white,white,white,transparent)]"
      )}
    />
  )
}

export default function CustomBackground({ type }: { type: string }) {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === 'light' ? '#10b981' : '#059669';

  switch (type) {
    case 'dot':
      return (
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            "mt-1",
            "[mask-image:linear-gradient(to_bottom,white,white,white,white,transparent)]"
          )}
        />
      )
    case 'animated-grid':
      return (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 h-full w-full">
            <AnimatedGridPattern
              width={100}
              height={100}
              numSquares={30}
              maxOpacity={0.1}
              duration={2}
              className={cn(
                "[mask-image:radial-gradient(500px_circle_at_center,white,white)]",
              )}
            />
          </div>
        </div>
      )
    case 'particles':
      return (
        <Particles
          className="absolute inset-0 w-full h-full"
          color={color}
          vx={0.05}
          vy={0.05}
        />
      )
    default:
      return defaultBackground()
  }
}
