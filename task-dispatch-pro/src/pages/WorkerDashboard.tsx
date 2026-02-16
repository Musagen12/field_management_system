import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authStorage, logout } from '@/lib/auth';
import { getWorkerTasks, acknowledgeTask, uploadTaskEvidence, submitWorkerComplaint, getWorkerComplaintCount, getWorkerComplaints } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { LogOut, Camera, AlertTriangle, ClipboardList, CheckCircle, User, MessageSquare } from 'lucide-react';
import { ActiveTaskCard } from '@/components/ActiveTaskCard';
import { TasksTable } from '@/components/TasksTable';
import { ComplaintsTable } from '@/components/ComplaintsTable';
import { ComplaintCreateDialog } from '@/components/ComplaintCreateDialog';
import { WorkerProfileCard } from '@/components/WorkerProfileCard';
import { WorkerComplaintForm } from '@/components/WorkerComplaintForm';

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
  photo_url?: string;
  evidence: Evidence[];
}

interface Complaint {
  id: string;
  description: string;
  status: string;
  submitted_by: string;
  created_at: string;
  file_url?: string;
  location?: string;
}

const WorkerDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = authStorage.getUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, complaintsData] = await Promise.all([
        getWorkerTasks(),
        getWorkerComplaints()
      ]);
      
      // All tasks from worker endpoint are already filtered by backend
      const workerTasks = tasksData;
      
      setTasks(workerTasks);
      setComplaints(complaintsData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await getWorkerTasks();
      setTasks(tasksData);
      toast({
        title: "Success",
        description: "Tasks refreshed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh tasks",
      });
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, status: string) => {
    try {
      if (status === 'acknowledged') {
        await acknowledgeTask(taskId);
      }
      await loadData();
      toast({
        title: "Success",
        description: `Task ${status === 'acknowledged' ? 'acknowledged' : 'updated'}`,
      });
    } catch (error) {
      // Error already handled by API layer
    }
  };

  const handlePhotoUpload = async (taskId: string, files: File[]) => {
    try {
      await uploadTaskEvidence(taskId, files);
      await loadData();
      toast({
        title: "Success",
        description: "Evidence uploaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Failed to upload evidence",
      });
    }
  };

  const activeTask = tasks.find(task => task.status === 'pending' || task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const pendingComplaintsCount = complaints.filter(c => ['pending', 'new', 'open'].includes((c.status || '').toLowerCase())).length;
  
  const loadComplaints = async () => {
    try {
      const complaintsData = await getWorkerComplaints();
      setComplaints(complaintsData);
      toast({
        title: "Success",
        description: "Complaints refreshed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh complaints",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Worker Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.username}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Task</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeTask ? 1 : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeTask ? 'Task in progress' : 'No active task'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Complaints</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{complaints.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingComplaintsCount} pending
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Task Section */}
        {activeTask && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Active Task</h2>
            <ActiveTaskCard 
              task={activeTask}
              onStatusUpdate={handleTaskStatusUpdate}
              onPhotoUpload={handlePhotoUpload}
            />
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="tasks">My Tasks</TabsTrigger>
              <TabsTrigger value="my-complaints">My Complaints</TabsTrigger>
              <TabsTrigger value="submit-complaint">Submit Complaint</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              {completedTasks.length} completed, {tasks.length - completedTasks.length} remaining
            </div>
          </div>

          <TabsContent value="tasks">
            <TasksTable 
              tasks={tasks} 
              onStatusUpdate={handleTaskStatusUpdate}
              onPhotoUpload={handlePhotoUpload}
              onRefresh={loadTasks}
              isAdmin={false}
            />
          </TabsContent>

          <TabsContent value="my-complaints">
            <ComplaintsTable 
              complaints={complaints}
              onStatusUpdate={() => {}} // Workers cannot update complaint status
              onRefresh={loadComplaints}
              isAdmin={false}
            />
          </TabsContent>

          <TabsContent value="submit-complaint">
            <WorkerComplaintForm onComplaintSubmitted={loadData} />
          </TabsContent>

          <TabsContent value="profile">
            <WorkerProfileCard />
          </TabsContent>
        </Tabs>
      </div>

      <ComplaintCreateDialog 
        open={isComplaintDialogOpen}
        onOpenChange={setIsComplaintDialogOpen}
        onComplaintCreated={loadData}
      />
    </div>
  );
};

export default WorkerDashboard;