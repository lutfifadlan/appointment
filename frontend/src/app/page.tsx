import { Lock, Users, Clock } from 'lucide-react';
import LeftToRightArrow from "@/components/custom-ui/arrows/left-to-right";
import GetStartedButton from "@/components/custom-ui/buttons/get-started";
import CommonLayout from "@/components/common-layout";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import { cn } from '@/lib/utils';
import { useId } from 'react';

const words = [
  {
    text: "Book",
  },
  {
    text: "appointments",
  },
  {
    text: "reliably",
  }
];

const FeatureCard = ({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) => {
  const pattern = [
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
    [Math.floor(Math.random() * 4) + 7, Math.floor(Math.random() * 6) + 1],
  ];

  return (
    <div className="relative bg-gradient-to-b dark:from-neutral-900 from-neutral-100 dark:to-neutral-950 to-white p-6 rounded-3xl overflow-hidden h-full">
      <div className="absolute inset-0">
        <Grid size={20} pattern={[pattern[0], pattern[1], pattern[2]]} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          <Icon className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-bold text-neutral-800 dark:text-white">{title}</h3>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">{description}</p>
      </div>
    </div>
  );
};

const Grid = ({
  pattern,
  size = 40,
}: {
  pattern: number[][];
  size?: number;
}) => {
  const patternId = useId();
  
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-zinc-900/30 from-zinc-100/30 to-zinc-300/30 dark:to-zinc-900/30 opacity-100">
        <svg className="absolute inset-0 h-full w-full mix-blend-overlay dark:fill-white/10 dark:stroke-white/10 stroke-black/10 fill-black/10" aria-hidden="true">
          <defs>
            <pattern
              id={patternId}
              width={size}
              height={size}
              patternUnits="userSpaceOnUse"
              x="-12"
              y="4"
            >
              <path d={`M.5 ${size}V.5H${size}`} fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
          <svg x="-12" y="4" className="overflow-visible">
            {pattern.map(([x, y], i) => (
              <rect
                key={`${x}-${y}-${i}`}
                strokeWidth="0"
                width={size + 1}
                height={size + 1}
                x={x * size}
                y={y * size}
              />
            ))}
          </svg>
        </svg>
      </div>
    </div>
  );
};

const features = [
  {
    title: "Smart Locking System",
    description: "Prevent double-bookings and editing conflicts with our intelligent lock mechanism",
    icon: Lock,
  },
  {
    title: "Real-time Collaboration",
    description: "See who's editing what, when, with live cursors and instant updates",
    icon: Users,
  },
  {
    title: "Conflict-Free Scheduling",
    description: "Our advanced concurrency control means no more overlapping appointments or lost changes",
    icon: Clock,
  },
];

export default function Home() {
  return (
    <CommonLayout>
      <div className="min-h-[calc(100vh-12rem)] relative pt-4">
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:20px_20px]",
            "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
            "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]",
          )}
        />
        {/* Radial gradient for the container to give a faded look */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"></div>
        <div className="text-4xl md:text-5xl font-black text-center">
          <div className="relative inline-block">
            <TypewriterEffectSmooth words={words} />
          </div>
        </div>
        <p className="text-center text-2xl relative z-10">
          Eliminates scheduling conflicts with intelligent real-time collaboration
        </p>

        <div className="relative flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mt-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center space-x-3">
              <LeftToRightArrow />
              <GetStartedButton />
            </div>
          </div>
        </div>

        <div className="mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage appointments efficiently and effectively
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            ))}
          </div>
        </div>
      </div>
    </CommonLayout>
  );
}
