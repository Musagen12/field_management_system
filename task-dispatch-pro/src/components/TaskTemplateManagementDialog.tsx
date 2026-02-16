import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getTaskTemplates, createTaskTemplate, deleteTaskTemplate, getFacilities, TaskTemplate, Facility } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

interface TaskTemplateManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

export const TaskTemplateManagementDialog = ({ open, onOpenChange, embedded = false }: TaskTemplateManagementDialogProps) => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState<'recurring' | 'one_off_short'>('recurring');

  useEffect(() => {
    if (open || embedded) {
      loadData();
    }
  }, [open, embedded]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [templatesData, facilitiesData] = await Promise.all([
        getTaskTemplates(),
        getFacilities()
      ]);
      setTemplates(templatesData);
      setFacilities(facilitiesData);
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

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !selectedFacilityId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields and select a facility",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createTaskTemplate({ title, description, task_type: selectedTaskType, facility_id: selectedFacilityId });
      toast({
        title: "Success",
        description: "Task template created successfully",
      });
      setTitle('');
      setDescription('');
      setSelectedFacilityId('');
      setSelectedTaskType('recurring');
      setShowForm(false);
      loadData();
    } catch (error) {
      // Error handled by API layer
    } finally {
      setIsCreating(false);
    }
  };

  const getFacilityName = (facilityId?: string) => {
    if (!facilityId) return 'N/A';
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.name || facilityId;
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTaskTemplate(templateId);
      toast({
        title: "Success",
        description: "Task template deleted",
      });
      loadData();
    } catch (error) {
      // Error handled by API layer
    }
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
          disabled={facilities.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {facilities.length === 0 && !isLoading && (
        <div className="text-center py-4 text-muted-foreground bg-muted/50 rounded-lg">
          Please create a facility first before adding task templates.
        </div>
      )}

      {showForm && facilities.length > 0 && (
        <form onSubmit={handleCreateTemplate} className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="template-title">Template Title</Label>
            <Input
              id="template-title"
              placeholder="Enter template title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Enter template description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility">Facility</Label>
            <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name} {facility.building_name ? `(${facility.building_name})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-type">Task Type</Label>
            <Select value={selectedTaskType} onValueChange={(v) => setSelectedTaskType(v as 'recurring' | 'one_off_short')}>
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="one_off_short">One-Off Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setTitle('');
                setDescription('');
                setSelectedFacilityId('');
                setSelectedTaskType('recurring');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No task templates found. Create one to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {template.facility?.name || getFacilityName(template.facility_id)}
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  {template.task_type?.replace('_', ' ') || 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {template.description}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
          <CardTitle>Manage Task Templates</CardTitle>
          <CardDescription>Create and manage reusable task templates tied to facilities</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Task Templates</DialogTitle>
          <DialogDescription>
            Create and manage reusable task templates tied to facilities
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
