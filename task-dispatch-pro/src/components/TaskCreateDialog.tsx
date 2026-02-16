import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTask, getWorkers, getTaskTemplates, TaskTemplate } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}

interface Worker {
  id: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const TaskCreateDialog = ({ open, onOpenChange, onTaskCreated }: TaskCreateDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState('');
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const [workersData, templatesData] = await Promise.all([
        getWorkers(),
        getTaskTemplates()
      ]);
      
      // Show all active workers - API will handle task assignment restrictions
      const activeWorkers = workersData.filter(worker => worker.status === 'active');
      setWorkers(activeWorkers);
      
      // Filter templates to only show one_off_short type for manual assignment
      const oneOffTemplates = templatesData.filter(template => template.task_type === 'one_off_short');
      setTemplates(oneOffTemplates);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate || !assignedTo) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a template and a worker",
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selected template not found",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createTask(selectedTemplate, assignedTo);
      
      toast({
        title: "Success",
        description: "Task created and assigned successfully",
      });
      
      setSelectedTemplate('');
      setAssignedTo('');
      onOpenChange(false);
      onTaskCreated();
    } catch (error) {
      // Error already handled by API layer
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Select a task template and assign it to a worker
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Task Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate} disabled={isLoadingData}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingData ? "Loading templates..." : "Select a template"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-sm text-muted-foreground mt-1">
                {templates.find(t => t.id === selectedTemplate)?.description}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="worker">Assign to Worker</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo} disabled={isLoadingData}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingData ? "Loading workers..." : "Select a worker"} />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.username}>
                    {worker.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Assigning...' : 'Assign Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
