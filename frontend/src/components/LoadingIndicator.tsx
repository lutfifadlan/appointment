import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wifi, WifiOff, Lock, Unlock, Save, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LoadingState = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'acquiring-lock'
  | 'lock-acquired'
  | 'releasing-lock'
  | 'lock-released'
  | 'saving'
  | 'saved'
  | 'error';

interface LoadingIndicatorProps {
  state: LoadingState;
  message?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const stateConfig = {
  idle: {
    icon: null,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    message: 'Ready',
    spinning: false,
  },
  connecting: {
    icon: Wifi,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    message: 'Connecting to server...',
    spinning: true,
  },
  connected: {
    icon: Wifi,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    message: 'Connected',
    spinning: false,
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    message: 'Disconnected',
    spinning: false,
  },
  'acquiring-lock': {
    icon: Lock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    message: 'Acquiring lock...',
    spinning: true,
  },
  'lock-acquired': {
    icon: Lock,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    message: 'Lock acquired',
    spinning: false,
  },
  'releasing-lock': {
    icon: Unlock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    message: 'Releasing lock...',
    spinning: true,
  },
  'lock-released': {
    icon: Unlock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    message: 'Lock released',
    spinning: false,
  },
  saving: {
    icon: Save,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    message: 'Saving changes...',
    spinning: true,
  },
  saved: {
    icon: Save,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    message: 'Changes saved',
    spinning: false,
  },
  error: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    message: 'Error occurred',
    spinning: false,
  },
};

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    padding: 'px-2 py-1',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-3 py-2',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-4 py-3',
  },
};

export function LoadingIndicator({
  state,
  message,
  className,
  showIcon = true,
  size = 'md',
}: LoadingIndicatorProps) {
  const config = stateConfig[state];
  const sizeClass = sizeConfig[size];
  const Icon = config.icon;
  const displayMessage = message || config.message;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border transition-all duration-200',
        config.bgColor,
        config.color,
        sizeClass.padding,
        className
      )}
    >
      {showIcon && Icon && (
        <motion.div
          animate={config.spinning ? { rotate: 360 } : {}}
          transition={config.spinning ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          {config.spinning ? (
            <Loader2 className={cn(sizeClass.icon, 'animate-spin')} />
          ) : (
            <Icon className={sizeClass.icon} />
          )}
        </motion.div>
      )}
      <span className={cn('font-medium', sizeClass.text)}>
        {displayMessage}
      </span>
    </motion.div>
  );
}

// Composite component for connection status
interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  className?: string;
}

export function ConnectionStatus({ 
  isConnected, 
  isConnecting, 
  className 
}: ConnectionStatusProps) {
  const getState = (): LoadingState => {
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  return (
    <LoadingIndicator
      state={getState()}
      size="sm"
      className={className}
    />
  );
}

// Composite component for lock status
interface LockStatusProps {
  isLocked: boolean;
  isLoading: boolean;
  isCurrentUserLockOwner: boolean;
  lockOwnerName?: string;
  className?: string;
}

export function LockStatus({
  isLocked,
  isLoading,
  isCurrentUserLockOwner,
  lockOwnerName,
  className
}: LockStatusProps) {
  const getState = (): LoadingState => {
    if (isLoading) {
      return isLocked ? 'releasing-lock' : 'acquiring-lock';
    }
    if (isLocked) {
      return isCurrentUserLockOwner ? 'lock-acquired' : 'lock-acquired';
    }
    return 'lock-released';
  };

  const getMessage = () => {
    if (isLoading) {
      return isLocked ? 'Releasing lock...' : 'Acquiring lock...';
    }
    if (isLocked) {
      return isCurrentUserLockOwner 
        ? 'You have control' 
        : `Locked by ${lockOwnerName || 'another user'}`;
    }
    return 'Available for editing';
  };

  return (
    <LoadingIndicator
      state={getState()}
      message={getMessage()}
      size="sm"
      className={className}
    />
  );
}

// Hook for managing loading states
export function useLoadingState(initialState: LoadingState = 'idle') {
  const [state, setState] = React.useState<LoadingState>(initialState);
  const [message, setMessage] = React.useState<string | undefined>();

  const updateState = React.useCallback((newState: LoadingState, customMessage?: string) => {
    setState(newState);
    setMessage(customMessage);
  }, []);

  const resetState = React.useCallback(() => {
    setState('idle');
    setMessage(undefined);
  }, []);

  return {
    state,
    message,
    updateState,
    resetState,
    LoadingIndicator: (props: Omit<LoadingIndicatorProps, 'state' | 'message'>) => (
      <LoadingIndicator 
        {...props} 
        state={state} 
        message={message} 
      />
    ),
  };
} 