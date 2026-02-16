import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface LogFilterValues {
  type: string;
  time: string;
  customDateRange?: {
    from: Date;
    to: Date;
  };
}

interface LogFiltersProps {
  onFilterChange: (filters: LogFilterValues) => void;
}

export const LogFilters = ({ onFilterChange }: LogFiltersProps) => {
  const [eventType, setEventType] = useState('all');
  const [timeRange, setTimeRange] = useState('today');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);

  const eventTypeOptions = [
    { value: 'all', label: 'All' },
    { value: 'login_logout', label: 'Login/Logout' },
    { value: 'task_logs', label: 'Task Logs' },
    { value: 'worker_logs', label: 'Worker Logs' },
    { value: 'profile_logs', label: 'Profile Logs' },
    { value: 'complaint_logs', label: 'Complaint Logs' },
    { value: 'SMS_NOTIFICATION_SENT', label: 'SMS Notification Sent' },
  ];

  const timeRangeOptions = [
    { value: 'last_hour', label: 'Last Hour' },
    { value: 'today', label: 'Today' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom' },
  ];

  const handleEventTypeChange = (value: string) => {
    setEventType(value);
    onFilterChange({
      type: value,
      time: timeRange,
      customDateRange: dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined,
    });
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    if (value === 'custom') {
      setIsCustomDialogOpen(true);
    } else {
      onFilterChange({
        type: eventType,
        time: value,
      });
    }
  };

  const handleCustomDateApply = () => {
    if (dateRange.from && dateRange.to) {
      onFilterChange({
        type: eventType,
        time: 'custom',
        customDateRange: { from: dateRange.from, to: dateRange.to },
      });
      setIsCustomDialogOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={eventType} onValueChange={handleEventTypeChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Event Type" />
        </SelectTrigger>
        <SelectContent>
          {eventTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={timeRange} onValueChange={handleTimeRangeChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Time Range" />
        </SelectTrigger>
        <SelectContent>
          {timeRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Custom Date Range</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    disabled={(date) => dateRange.from ? date < dateRange.from : false}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              onClick={handleCustomDateApply} 
              disabled={!dateRange.from || !dateRange.to}
              className="w-full"
            >
              Apply Date Range
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
