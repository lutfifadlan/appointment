import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronLeft, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select time",
  className,
  label
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'hours' | 'minutes'>('hours');

  // Parse current value
  const parsedTime = useMemo(() => {
    if (!value) return { hour: null, minute: null };
    const [hourStr, minuteStr] = value.split(':');
    return {
      hour: parseInt(hourStr, 10),
      minute: parseInt(minuteStr, 10)
    };
  }, [value]);

  // Initialize selected values from current value
  React.useEffect(() => {
    if (parsedTime.hour !== null && parsedTime.minute !== null) {
      setSelectedHour(parsedTime.hour);
      setSelectedMinute(parsedTime.minute);
    }
  }, [parsedTime]);

  const formatTime = (hour: number | null, minute: number | null) => {
    if (hour === null || minute === null) return '';
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (hour: number | null, minute: number | null) => {
    if (hour === null || minute === null) return placeholder;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeIcon = (hour: number | null) => {
    if (hour === null) return Clock;
    if (hour >= 6 && hour < 12) return Sunrise;
    if (hour >= 12 && hour < 18) return Sun;
    if (hour >= 18 && hour < 22) return Sunset;
    return Moon;
  };

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    setCurrentView('minutes');
  };

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute);
    if (selectedHour !== null) {
      const timeString = formatTime(selectedHour, minute);
      onChange(timeString);
      setIsOpen(false);
      setCurrentView('hours');
    }
  };

  const quickTimeSlots = [
    { label: '9:00 AM', hour: 9, minute: 0 },
    { label: '10:00 AM', hour: 10, minute: 0 },
    { label: '11:00 AM', hour: 11, minute: 0 },
    { label: '1:00 PM', hour: 13, minute: 0 },
    { label: '2:00 PM', hour: 14, minute: 0 },
    { label: '3:00 PM', hour: 15, minute: 0 },
    { label: '4:00 PM', hour: 16, minute: 0 },
    { label: '5:00 PM', hour: 17, minute: 0 },
  ];

  const handleQuickTime = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    const timeString = formatTime(hour, minute);
    onChange(timeString);
    setIsOpen(false);
    setCurrentView('hours');
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const TimeIcon = getTimeIcon(selectedHour || parsedTime.hour);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {label}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-11",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <TimeIcon className="mr-2 h-4 w-4" />
            {formatDisplayTime(parsedTime.hour, parsedTime.minute)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b px-4 py-3">
            <h4 className="font-medium leading-none">Select Time</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Choose from quick times or pick custom time
            </p>
          </div>
          
          {/* Quick Time Slots */}
          <div className="p-4 border-b">
            <h5 className="text-sm font-medium mb-3 text-muted-foreground">Quick Times</h5>
            <div className="grid grid-cols-2 gap-2">
              {quickTimeSlots.map((slot) => (
                <Button
                  key={`${slot.hour}-${slot.minute}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickTime(slot.hour, slot.minute)}
                  className={cn(
                    "justify-start text-sm h-8",
                    selectedHour === slot.hour && selectedMinute === slot.minute && 
                    "bg-primary text-primary-foreground"
                  )}
                >
                  {slot.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Time Picker */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-muted-foreground">Custom Time</h5>
              <div className="flex items-center gap-2">
                {currentView === 'minutes' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('hours')}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                <Badge variant="outline" className="text-xs">
                  {currentView === 'hours' ? 'Select Hour' : 'Select Minutes'}
                </Badge>
              </div>
            </div>

            {/* Hours Grid */}
            {currentView === 'hours' && (
              <div className="grid grid-cols-6 gap-2">
                {hours.map((hour) => {
                  const period = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  return (
                    <Button
                      key={hour}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHourSelect(hour)}
                      className={cn(
                        "h-10 flex-col gap-1 text-xs",
                        selectedHour === hour && "bg-primary text-primary-foreground",
                        hour >= 6 && hour < 12 && "hover:bg-yellow-50",
                        hour >= 12 && hour < 18 && "hover:bg-blue-50",
                        hour >= 18 && hour < 22 && "hover:bg-orange-50",
                        (hour >= 22 || hour < 6) && "hover:bg-purple-50"
                      )}
                    >
                      <span className="font-medium">{displayHour}</span>
                      <span className="text-[10px] opacity-70">{period}</span>
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Minutes Grid */}
            {currentView === 'minutes' && (
              <div className="grid grid-cols-6 gap-2">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMinuteSelect(minute)}
                    className={cn(
                      "h-10 text-sm",
                      selectedMinute === minute && "bg-primary text-primary-foreground"
                    )}
                  >
                    :{minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            )}

            {/* Selected Time Display */}
            {(selectedHour !== null || selectedMinute !== null) && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  <Badge className="font-mono">
                    {formatDisplayTime(selectedHour, selectedMinute)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 