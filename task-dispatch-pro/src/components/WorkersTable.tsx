import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Worker {
  id: string;
  username: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface WorkersTableProps {
  workers: Worker[];
  onStatusUpdate: (username: string, status: string) => void;
  onRemoveWorker: (username: string) => void;
  onRefresh: () => void;
}

export const WorkersTable = ({ workers, onStatusUpdate, onRemoveWorker, onRefresh }: WorkersTableProps) => {
  const handleStatusUpdate = async (username: string, status: string) => {
    try {
      await onStatusUpdate(username, status);
      toast({
        title: "Success",
        description: "Worker status updated",
      });
    } catch (error) {
      // Error already handled by API layer
    }
  };

  const handleRemoveWorker = async (username: string) => {
    if (window.confirm('Are you sure you want to remove this worker?')) {
      try {
        await onRemoveWorker(username);
        toast({
          title: "Success",
          description: "Worker removed",
        });
      } catch (error) {
        // Error already handled by API layer
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Workers</CardTitle>
            <CardDescription>Manage worker accounts and their status</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium">{worker.username}</TableCell>
                <TableCell>
                  <Badge variant="outline">{worker.role}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={worker.status} />
                </TableCell>
                <TableCell>{new Date(worker.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {worker.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(worker.username, 'under_investigation')}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(worker.username, 'active')}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveWorker(worker.username)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {workers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No workers found. Add your first worker to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};