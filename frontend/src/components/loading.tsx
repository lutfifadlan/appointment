import React from "react";

interface LoadingProps {
  message?: string;
  fullscreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message = "Loading...", fullscreen = true }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${fullscreen ? "h-screen w-full" : "py-8 w-full"} bg-opacity-60 backdrop-blur-sm`}
      data-testid="loading-component"
    >
      <div className="relative flex items-center justify-center mb-4">
        <span className="sr-only dark:text-white">Loading</span>
        <span className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></span>
        <span className="absolute w-7 h-7 bg-primary rounded-full opacity-70 animate-pulse"></span>
      </div>
      <span className="text-lg font-semibold text-gray-800 dark:text-white animate-pulse">{message}</span>
    </div>
  );
};

export default Loading;
