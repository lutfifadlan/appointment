import { Building2, Rocket, CodeSquare } from 'lucide-react'
import CustomBackground from "@/components/custom-ui/backgrounds/custom";
import AngryUnderline from "@/components/custom-ui/underlines/angry";
import LeftToRightArrow from "@/components/custom-ui/arrows/left-to-right";
import GetStartedButton from "@/components/custom-ui/buttons/get-started";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CommonLayout from "@/components/common-layout";

const Feature: React.FC<{ title: string; description: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = ({ title, description, icon: Icon }) => {
  return (
    <Card className="w-full h-full transition-transform transform hover:scale-105 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff]">
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm sm:text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export default function Home() {
  return (
    <CommonLayout>
      <div className="min-h-[calc(100vh-12rem)] relative pt-4">
        <CustomBackground type="animated-grid" />
        <div className="text-4xl md:text-5xl font-black text-center">
          <div className="relative inline-block">
          <span className="absolute inset-0 bg-gray-300 dark:bg-gray-700 -rotate-1 rounded-sm -left-2 -right-2 top-1 -bottom-1"></span>
          <span className="relative inline-block py-1.5">
              Book appointment {' '}
              <AngryUnderline>reliably</AngryUnderline>
            </span>
          </div>
        </div>
        <p className="text-center text-2xl mt-4 relative z-10">
          Eliminates scheduling conflicts with intelligent real-time collaboration
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mt-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center space-x-3">
              <LeftToRightArrow />
              <GetStartedButton />
            </div>
          </div>
        </div>

        <div className="mt-4 max-w-7xl mx-auto">
          <section className="relative mx-auto overflow-hidden grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 p-4 pb-5 rounded-lg">
            <BorderBeam size={300} colorFrom='#000000' colorTo='#A9A9A9' />
            <Feature
              title="Smart Locking System"
              description="Prevent double-bookings and editing conflicts with our intelligent lock mechanism"
              icon={Building2}
            />
            <Feature
              title="Real-time Collaboration"
              description="See who's editing what, when, with live cursors and instant updates"
              icon={Rocket}
            />
            <Feature
              title="Conflict-Free Scheduling"
              description="Our advanced concurrency control means no more overlapping appointments or lost changes"
              icon={CodeSquare}
            />
          </section>
        </div>
      </div>
    </CommonLayout>
  );
}
