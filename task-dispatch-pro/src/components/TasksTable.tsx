import { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Camera, RefreshCw, FileImage, RotateCcw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/dateUtils';
import { ImageWithAuth } from '@/components/ImageWithAuth';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { resetTaskStatus, deleteTask, getTaskTemplate, TaskTemplate } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Evidence {
  id: string;
  file_url: string;
  uploaded_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string;
  created_at: string;
  template_id?: string;
  worker_name?: string;
  photo_url?: string;
  evidence: Evidence[];
}

interface TasksTableProps {
  tasks: Task[];
  onStatusUpdate: (taskId: string, status: string) => void;
  onPhotoUpload?: (taskId: string, files: File[]) => void;
  onRefresh: () => void;
  isAdmin: boolean;
}

export const TasksTable = ({ tasks, onStatusUpdate, onPhotoUpload, onRefresh, isAdmin }: TasksTableProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [selectedTaskEvidence, setSelectedTaskEvidence] = useState<Evidence[] | null>(null);
  const [currentEvidenceIndex, setCurrentEvidenceIndex] = useState<number>(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resettingTaskId, setResettingTaskId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [templateFacilityMap, setTemplateFacilityMap] = useState<Record<string, { facilityName: string; buildingName?: string }>>({});
  const [facilityOptions, setFacilityOptions] = useState<{ name: string; templateIds: string[] }[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Load facility info by fetching each unique template
  useEffect(() => {
    const loadFacilityData = async () => {
      const uniqueTemplateIds = [...new Set(tasks.map(t => t.template_id).filter(Boolean))] as string[];
      const map: Record<string, { facilityName: string; buildingName?: string }> = {};

      await Promise.all(
        uniqueTemplateIds.map(async (templateId) => {
          try {
            const template = await getTaskTemplate(templateId);
            if (template.facility?.name) {
              map[templateId] = { facilityName: template.facility.name };
            }
          } catch (e) {
            console.error(`Failed to load template ${templateId}:`, e);
          }
        })
      );

      setTemplateFacilityMap(map);

      // Build unique facility options
      const facilityMap = new Map<string, string[]>();
      for (const [tid, info] of Object.entries(map)) {
        const existing = facilityMap.get(info.facilityName) || [];
        existing.push(tid);
        facilityMap.set(info.facilityName, existing);
      }
      setFacilityOptions(
        Array.from(facilityMap.entries()).map(([name, templateIds]) => ({ name, templateIds })).sort((a, b) => a.name.localeCompare(b.name))
      );
    };
    if (tasks.length > 0) loadFacilityData();
  }, [tasks]);

  // Get facility name for a task
  const getTaskFacilityName = (task: Task): string | undefined => {
    if (!task.template_id) return undefined;
    return templateFacilityMap[task.template_id]?.facilityName;
  };

  const getFullImageUrl = (filePath: string) => {
    // Remove any leading slash and construct the full URL
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  // Extract unique task titles (templates) for filter
  const uniqueTemplates = useMemo(() => {
    const titles = [...new Set(tasks.map(task => task.title))];
    return titles.sort();
  }, [tasks]);

  // Date filter options
  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const handleResetTask = async () => {
    if (!resettingTaskId || !resetReason.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide a reason for resetting the task",
      });
      return;
    }

    setIsResetting(true);
    try {
      await resetTaskStatus(resettingTaskId, resetReason);
      toast({
        title: "Task Reset",
        description: "Task status has been reset and worker has been notified",
      });
      setResetDialogOpen(false);
      setResetReason('');
      setResettingTaskId(null);
      onRefresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error?.message || "Failed to reset task status",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;

    setIsDeleting(true);
    try {
      await deleteTask(deletingTaskId);
      toast({
        title: "Task Deleted",
        description: "The task has been successfully deleted",
      });
      setDeleteDialogOpen(false);
      setDeletingTaskId(null);
      onRefresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error?.message || "Failed to delete task",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter tasks by status, template, facility, and date
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      
      // Template filter
      if (templateFilter !== 'all' && task.title !== templateFilter) return false;
      
      // Facility filter - use template_id to match facility
      if (facilityFilter !== 'all') {
        if (!task.template_id) return false;
        const facilityName = templateFacilityMap[task.template_id]?.facilityName;
        if (facilityName !== facilityFilter) return false;
      }
      
      // Date filter
      if (dateFilter !== 'all') {
        const taskDate = new Date(task.created_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        switch (dateFilter) {
          case 'today':
            if (taskDate < today) return false;
            break;
          case 'yesterday':
            if (taskDate < yesterday || taskDate >= today) return false;
            break;
          case 'week':
            if (taskDate < weekStart) return false;
            break;
          case 'month':
            if (taskDate < monthStart) return false;
            break;
        }
      }
      
      return true;
    });
  }, [tasks, statusFilter, templateFilter, facilityFilter, dateFilter, templateFacilityMap]);

  const sortedTasks = [...filteredTasks].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const clearFilters = () => {
    setStatusFilter('all');
    setTemplateFilter('all');
    setFacilityFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || templateFilter !== 'all' || facilityFilter !== 'all' || dateFilter !== 'all';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>
              {isAdmin ? 'Manage all tasks and assignments' : 'Your task history and current assignments'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                {uniqueTemplates.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={facilityFilter} onValueChange={setFacilityFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilityOptions.map((facility) => (
                  <SelectItem key={facility.name} value={facility.name}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                {dateFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                Clear filters
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Worker</TableHead>}
                <TableHead>Evidence</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {getTaskFacilityName(task) && (
                        <div className="text-xs text-muted-foreground">
                          {getTaskFacilityName(task)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                   <TableCell>
                     <StatusBadge status={task.status} />
                   </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {task.assigned_to ? (
                          <Badge variant="outline">{task.assigned_to}</Badge>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                    )}
                   <TableCell>
                     <div className="flex items-center gap-2">
                       {task.evidence && task.evidence.length > 0 ? (
                         <Badge 
                           variant="secondary" 
                           className="text-xs cursor-pointer hover:bg-secondary/80"
                           onClick={() => {
                             setSelectedTaskEvidence(task.evidence);
                             setCurrentEvidenceIndex(0);
                           }}
                         >
                           <FileImage className="h-3 w-3 mr-1" />
                           {task.evidence.length} image{task.evidence.length > 1 ? 's' : ''}
                         </Badge>
                       ) : (
                         <span className="text-muted-foreground text-xs">No evidence</span>
                       )}
                     </div>
                   </TableCell>
                   <TableCell>
                     {formatDateTime(task.created_at)}
                   </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-2">
                       <Dialog>
                         <DialogTrigger asChild>
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => setSelectedTask(task)}
                           >
                             <Eye className="h-4 w-4" />
                           </Button>
                         </DialogTrigger>
                         <DialogContent className="max-w-2xl">
                           <DialogHeader>
                             <DialogTitle>{task.title}</DialogTitle>
                           </DialogHeader>
                           <div className="space-y-4">
                             <div>
                               <h4 className="font-medium">Description</h4>
                               <p className="text-sm text-muted-foreground">{task.description}</p>
                             </div>
                             <div className="flex items-center gap-4">
                               <div>
                                 <h4 className="font-medium">Status</h4>
                                 <StatusBadge status={task.status} />
                               </div>
                               <div>
                                 <h4 className="font-medium">Created</h4>
                                 <p className="text-sm">{formatDateTime(task.created_at)}</p>
                               </div>
                             </div>
                              {task.photo_url && (
                                <div>
                                  <h4 className="font-medium mb-2">Completion Photo</h4>
                                   <ImageWithAuth
                                     srcPath={task.photo_url || ''}
                                     alt="Task completion"
                                     className="max-w-full h-64 object-cover rounded-md border"
                                   />
                                </div>
                              )}
                              {task.evidence && task.evidence.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Evidence ({task.evidence.length})</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {task.evidence.map((evidence, index) => (
                                      <div key={evidence.id} className="relative group">
                                      <ImageWithAuth
                                          srcPath={evidence.file_url}
                                          alt={`Evidence ${index + 1}`}
                                          className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80"
                                          onClick={() => {
                                            setSelectedTaskEvidence(task.evidence);
                                            setCurrentEvidenceIndex(index);
                                          }}
                                        />
                                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                          {formatDateTime(evidence.uploaded_at)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                           </div>
                         </DialogContent>
                       </Dialog>
                       
                       {isAdmin && task.status === 'completed' && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             setResettingTaskId(task.id);
                             setResetDialogOpen(true);
                           }}
                         >
                           <RotateCcw className="h-4 w-4" />
                         </Button>
                       )}
                       
                       {isAdmin && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             setDeletingTaskId(task.id);
                             setDeleteDialogOpen(true);
                           }}
                           className="text-destructive hover:text-destructive"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                       
                       {task.photo_url && (
                         <Badge variant="secondary" className="text-xs">
                           <Camera className="h-3 w-3 mr-1" />
                           Photo
                         </Badge>
                       )}
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {sortedTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found
            </div>
          )}
        </div>
      </CardContent>

      {/* Image Viewer Dialog with Navigation */}
      <Dialog open={!!selectedTaskEvidence} onOpenChange={() => setSelectedTaskEvidence(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>Evidence Image</span>
              {selectedTaskEvidence && selectedTaskEvidence.length > 1 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {currentEvidenceIndex + 1} of {selectedTaskEvidence.length}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center h-[calc(95vh-80px)] p-6 pt-2 overflow-auto">
            {selectedTaskEvidence && selectedTaskEvidence.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-8 z-10 bg-background/80 hover:bg-background"
                  onClick={() => setCurrentEvidenceIndex(prev => 
                    prev > 0 ? prev - 1 : selectedTaskEvidence.length - 1
                  )}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-8 z-10 bg-background/80 hover:bg-background"
                  onClick={() => setCurrentEvidenceIndex(prev => 
                    prev < selectedTaskEvidence.length - 1 ? prev + 1 : 0
                  )}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            {selectedTaskEvidence && selectedTaskEvidence[currentEvidenceIndex] && (
              <div className="flex flex-col items-center gap-2">
                <ImageWithAuth
                  srcPath={selectedTaskEvidence[currentEvidenceIndex].file_url}
                  alt="Evidence"
                  className="max-w-full max-h-[calc(95vh-140px)] object-contain cursor-zoom-in hover:scale-105 transition-transform"
                  onClick={(e) => {
                    const img = e.currentTarget;
                    if (img.style.transform === 'scale(2)') {
                      img.style.transform = 'scale(1)';
                      img.style.cursor = 'zoom-in';
                    } else {
                      img.style.transform = 'scale(2)';
                      img.style.cursor = 'zoom-out';
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  Uploaded: {formatDateTime(selectedTaskEvidence[currentEvidenceIndex].uploaded_at)}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Task Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Task Status</DialogTitle>
            <DialogDescription>
              Provide a reason for resetting this task. The worker will be notified with your message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetReason">Reason for Reset</Label>
              <Textarea
                id="resetReason"
                placeholder="e.g., Work quality doesn't meet standards, please redo..."
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetDialogOpen(false);
                setResetReason('');
                setResettingTaskId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetTask}
              disabled={isResetting || !resetReason.trim()}
            >
              {isResetting ? 'Resetting...' : 'Reset Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingTaskId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};