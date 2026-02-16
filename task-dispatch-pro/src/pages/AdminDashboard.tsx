import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { authStorage, logout } from '@/lib/auth';
import { getTasks, getComplaints, getAdminComplaints, getAuditLogs, updateTaskStatus, updateComplaintStatus, getWorkers, updateWorkerStatus, removeWorker } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { LogOut, Plus, Users, ClipboardList, AlertTriangle, FileText, FileStack, Building2, Warehouse, CalendarClock } from 'lucide-react';
import { TaskCreateDialog } from '@/components/TaskCreateDialog';
import { WorkerManagementDialog } from '@/components/WorkerManagementDialog';
import { TaskTemplateManagementDialog } from '@/components/TaskTemplateManagementDialog';
import { BuildingManagementDialog } from '@/components/BuildingManagementDialog';
import { FacilityManagementDialog } from '@/components/FacilityManagementDialog';
import { DutyRosterManagementDialog } from '@/components/DutyRosterManagementDialog';
import { TasksTable } from '@/components/TasksTable';
import { ComplaintsTable } from '@/components/ComplaintsTable';
import { AuditLogsTable } from '@/components/AuditLogsTable';
import { WorkersTable } from '@/components/WorkersTable';

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
  worker_name?: string;
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
  worker_name?: string;
}

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  user_id: string;
  created_at: string;
  details?: any;
}

const AdminDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isWorkerDialogOpen, setIsWorkerDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = authStorage.getUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, complaintsData, auditData, workersData] = await Promise.all([
        getTasks(),
        getAdminComplaints(), // Use admin endpoint for complaints to include worker complaints
        getAuditLogs(),
        getWorkers()
      ]);
      
      setTasks(tasksData);
      setComplaints(complaintsData);
      setAuditLogs(auditData);
      setWorkers(workersData);
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
      const tasksData = await getTasks();
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

  const loadWorkers = async () => {
    try {
      const workersData = await getWorkers();
      setWorkers(workersData);
      toast({
        title: "Success",
        description: "Workers refreshed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh workers",
      });
    }
  };

  const loadAuditLogs = async () => {
    try {
      const auditData = await getAuditLogs();
      setAuditLogs(auditData);
      toast({
        title: "Success",
        description: "Audit logs refreshed",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh audit logs",
      });
    }
  };

  const loadComplaints = async () => {
    try {
      const complaintsData = await getAdminComplaints();
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

  const handleTaskStatusUpdate = async (taskId: string, status: string) => {
    try {
      await updateTaskStatus(taskId, status);
      await loadData();
      toast({
        title: "Success",
        description: "Task status updated",
      });
    } catch (error) {
      // Error already handled by API layer
    }
  };

  const handleComplaintStatusUpdate = async (complaintId: string, status: string) => {
    try {
      await updateComplaintStatus(complaintId, status);
      await loadData();
      toast({
        title: "Success",
        description: "Complaint status updated",
      });
    } catch (error) {
      // Error already handled by API layer
    }
  };

  const stats = {
    totalTasks: tasks.length,
    activeTasks: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    pendingComplaints: complaints.filter(c => c.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
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
            <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.activeTasks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendingComplaints}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.completedTasks}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="workers" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="duty-roster">Duty Roster</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="workers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Workers Management</CardTitle>
                  <CardDescription>Manage your workers</CardDescription>
                </div>
                <Button onClick={() => setIsWorkerDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worker
                </Button>
              </CardHeader>
              <CardContent>
                <WorkersTable 
                  workers={workers}
                  onStatusUpdate={async (username: string, status: string) => {
                    await updateWorkerStatus(username, status);
                    await loadData();
                  }}
                  onRemoveWorker={async (username: string) => {
                    await removeWorker(username);
                    await loadData();
                  }}
                  onRefresh={loadWorkers}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tasks Management</CardTitle>
                  <CardDescription>View and manage tasks</CardDescription>
                </div>
                <Button onClick={() => setIsTaskDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Task
                </Button>
              </CardHeader>
              <CardContent>
                <TasksTable 
                  tasks={tasks} 
                  onStatusUpdate={() => {}}
                  onRefresh={loadTasks}
                  isAdmin={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle>Complaints Management</CardTitle>
                <CardDescription>View and resolve complaints</CardDescription>
              </CardHeader>
              <CardContent>
                <ComplaintsTable 
                  complaints={complaints}
                  onStatusUpdate={handleComplaintStatusUpdate}
                  onRefresh={loadComplaints}
                  isAdmin={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buildings">
            <BuildingManagementDialog
              open={true}
              onOpenChange={() => {}}
              embedded={true}
            />
          </TabsContent>

          <TabsContent value="facilities">
            <FacilityManagementDialog
              open={true}
              onOpenChange={() => {}}
              embedded={true}
            />
          </TabsContent>

          <TabsContent value="templates">
            <TaskTemplateManagementDialog
              open={true}
              onOpenChange={() => {}}
              embedded={true}
            />
          </TabsContent>

          <TabsContent value="duty-roster">
            <DutyRosterManagementDialog
              open={true}
              onOpenChange={() => {}}
              embedded={true}
            />
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>System activity logs</CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogsTable 
                  auditLogs={auditLogs}
                  onRefresh={loadAuditLogs}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TaskCreateDialog 
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onTaskCreated={loadData}
      />

      <WorkerManagementDialog 
        open={isWorkerDialogOpen}
        onOpenChange={setIsWorkerDialogOpen}
        onWorkerAdded={loadData}
      />
    </div>
  );
};

export default AdminDashboard;