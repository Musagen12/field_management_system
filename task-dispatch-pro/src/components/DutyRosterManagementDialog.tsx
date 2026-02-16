import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  getDutyRosters, 
  createDutyRoster, 
  updateDutyRoster, 
  deleteDutyRoster, 
  getTaskTemplates, 
  getWorkers,
  DutyRoster, 
  TaskTemplate 
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw, Edit2, X, Check, CalendarClock } from 'lucide-react';

interface DutyRosterManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
];

// Generate time options from 8:00 AM to 4:00 PM in 24h format
const TIME_OPTIONS = Array.from({ length: 17 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const minute = (i % 2) * 30;
  const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const hour12 = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  return { value: time24, label: time12 };
});

export const DutyRosterManagementDialog = ({ open, onOpenChange, embedded = false }: DutyRosterManagementDialogProps) => {
  const [rosters, setRosters] = useState<DutyRoster[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedWorkerName, setSelectedWorkerName] = useState('');
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  
  // Edit state
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editDays, setEditDays] = useState<string[]>([]);

  useEffect(() => {
    if (open || embedded) {
      loadData();
    }
  }, [open, embedded]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rostersData, templatesData, workersData] = await Promise.all([
        getDutyRosters(),
        getTaskTemplates(),
        getWorkers()
      ]);
      setRosters(rostersData);
      // Filter templates to only show recurring type for duty rosters
      const recurringTemplates = templatesData.filter(template => template.task_type === 'recurring');
      setTemplates(recurringTemplates);
      setWorkers(workersData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplateId('');
    setSelectedWorkerName('');
    setSelectedTime('08:00');
    setSelectedDays([]);
    setShowForm(false);
  };

  const handleCreateRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplateId || !selectedWorkerName || selectedDays.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields and select at least one day",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Format time as ISO time string with seconds
      const timeWithSeconds = `${selectedTime}:00.000Z`;
      
      await createDutyRoster({
        template_id: selectedTemplateId,
        worker_name: selectedWorkerName,
        start_time: timeWithSeconds,
        days: selectedDays.map(d => d.toLowerCase()),
      });
      toast({
        title: "Success",
        description: "Duty roster created successfully",
      });
      resetForm();
      loadData();
    } catch (error) {
      // Error handled by API layer
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRoster = async (rosterId: string) => {
    try {
      await deleteDutyRoster(rosterId);
      toast({
        title: "Success",
        description: "Duty roster deleted",
      });
      loadData();
    } catch (error) {
      // Error handled by API layer
    }
  };

  const handleToggleActive = async (roster: DutyRoster) => {
    try {
      await updateDutyRoster(roster.id, { active: !roster.active });
      toast({
        title: "Success",
        description: `Duty roster ${roster.active ? 'deactivated' : 'activated'}`,
      });
      loadData();
    } catch (error) {
      // Error handled by API layer
    }
  };

  const startEdit = (roster: DutyRoster) => {
    setEditingRosterId(roster.id);
    // Extract time from the start_time string
    const timePart = roster.start_time.split('T')[1]?.substring(0, 5) || roster.start_time.substring(0, 5);
    setEditTime(timePart);
    setEditDays(roster.days.map(d => d.toLowerCase()));
  };

  const cancelEdit = () => {
    setEditingRosterId(null);
    setEditTime('');
    setEditDays([]);
  };

  const saveEdit = async (rosterId: string) => {
    try {
      const timeWithSeconds = `${editTime}:00.000Z`;
      await updateDutyRoster(rosterId, {
        start_time: timeWithSeconds,
        days: editDays,
      });
      toast({
        title: "Success",
        description: "Duty roster updated",
      });
      cancelEdit();
      loadData();
    } catch (error) {
      // Error handled by API layer
    }
  };

  const toggleDay = (day: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditDays(prev => 
        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
      );
    } else {
      setSelectedDays(prev => 
        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
      );
    }
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.title || templateId;
  };

  const formatTime = (timeStr: string) => {
    try {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].substring(0, 5) : timeStr.substring(0, 5);
      const [hours, minutes] = timePart.split(':').map(Number);
      const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const formatDays = (days: string[]) => {
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
  };

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button 
          size="sm" 
          onClick={() => setShowForm(!showForm)}
          disabled={templates.length === 0 || workers.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Roster
        </Button>
      </div>

      {(templates.length === 0 || workers.length === 0) && !isLoading && (
        <div className="text-center py-4 text-muted-foreground bg-muted/50 rounded-lg">
          {templates.length === 0 && "Please create task templates first. "}
          {workers.length === 0 && "Please add workers first."}
        </div>
      )}

      {showForm && templates.length > 0 && workers.length > 0 && (
        <form onSubmit={handleCreateRoster} className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template">Task Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker">Worker</Label>
              <Select value={selectedWorkerName} onValueChange={setSelectedWorkerName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id || worker.username} value={worker.username}>
                      {worker.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Start Time (8 AM - 4 PM)</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div 
                    key={day.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <label 
                      htmlFor={`day-${day.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {day.label.slice(0, 3)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Roster'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading rosters...</p>
        </div>
      ) : rosters.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No duty rosters found. Create one to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Worker</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rosters.map((roster) => (
              <TableRow key={roster.id}>
                <TableCell className="font-medium">
                  {getTemplateName(roster.template_id)}
                </TableCell>
                <TableCell>{roster.worker_name}</TableCell>
                <TableCell>
                  {editingRosterId === roster.id ? (
                    <Select value={editTime} onValueChange={setEditTime}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    formatTime(roster.start_time)
                  )}
                </TableCell>
                <TableCell>
                  {editingRosterId === roster.id ? (
                    <div className="flex flex-wrap gap-1">
                      {DAYS_OF_WEEK.map((day) => (
                        <div 
                          key={day.value}
                          className="flex items-center space-x-1"
                        >
                          <Checkbox
                            id={`edit-day-${day.value}`}
                            checked={editDays.includes(day.value)}
                            onCheckedChange={() => toggleDay(day.value, true)}
                          />
                          <label 
                            htmlFor={`edit-day-${day.value}`}
                            className="text-xs cursor-pointer"
                          >
                            {day.label.slice(0, 2)}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    formatDays(roster.days)
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={roster.active}
                    onCheckedChange={() => handleToggleActive(roster)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {editingRosterId === roster.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveEdit(roster.id)}
                          className="text-success hover:text-success"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(roster)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRoster(roster.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  if (embedded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Manage Duty Rosters
          </CardTitle>
          <CardDescription>Create and manage worker duty schedules tied to task templates</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Duty Rosters</DialogTitle>
          <DialogDescription>
            Create and manage worker duty schedules tied to task templates
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};