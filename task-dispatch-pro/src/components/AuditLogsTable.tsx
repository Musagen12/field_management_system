import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/dateUtils';
import { LogFilters, LogFilterValues } from './LogFilters';
import { subHours, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  user_id: string;
  created_at: string;
  details?: any;
}

interface AuditLogsTableProps {
  auditLogs: AuditLog[];
  onRefresh: () => void;
}

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
      return 'bg-success/10 text-success border-success/20';
    case 'update':
      return 'bg-warning/10 text-warning-foreground border-warning/20';
    case 'delete':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const AuditLogsTable = ({ auditLogs, onRefresh }: AuditLogsTableProps) => {
  const [filters, setFilters] = useState<LogFilterValues>({
    type: 'all',
    time: 'today',
  });

  const handleFilterChange = (newFilters: LogFilterValues) => {
    setFilters(newFilters);
  };

  const filterByEventType = (log: AuditLog) => {
    if (filters.type === 'all') return true;
    
    const action = log.action.toLowerCase();
    const tableName = log.table_name?.toLowerCase() || '';
    
    switch (filters.type) {
      case 'login_logout':
        return action === 'login' || action === 'logout' || action.includes('login') || action.includes('logout');
      case 'task_logs':
        return tableName.includes('task') || action.includes('task');
      case 'worker_logs':
        return tableName.includes('worker') || action.includes('worker');
      case 'profile_logs':
        return tableName.includes('profile') || action.includes('profile');
      case 'complaint_logs':
        return tableName.includes('complaint') || action.includes('complaint');
      case 'SMS_NOTIFICATION_SENT':
        return action.includes('sms') || action === 'sms_notification_sent';
      default:
        return true;
    }
  };

  const filterByTimeRange = (log: AuditLog) => {
    const logDate = new Date(log.created_at);
    const now = new Date();

    switch (filters.time) {
      case 'last_hour':
        return logDate >= subHours(now, 1);
      case 'today':
        return isWithinInterval(logDate, {
          start: startOfDay(now),
          end: endOfDay(now),
        });
      case 'last_7_days':
        return logDate >= subDays(now, 7);
      case 'last_30_days':
        return logDate >= subDays(now, 30);
      case 'custom':
        if (filters.customDateRange) {
          return isWithinInterval(logDate, {
            start: startOfDay(filters.customDateRange.from),
            end: endOfDay(filters.customDateRange.to),
          });
        }
        return true;
      default:
        return true;
    }
  };

  // Apply filters and sort
  const filteredLogs = auditLogs
    .filter(filterByEventType)
    .filter(filterByTimeRange);

  // Sort logs by most recent first
  const sortedLogs = [...filteredLogs].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              System activity and change history
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <LogFilters onFilterChange={handleFilterChange} />
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
                <TableHead>Action</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {log.action.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{log.user_id}</code>
                  </TableCell>
                  <TableCell>
                    {log.details ? (
                      <div className="max-w-xs truncate text-xs">
                        {typeof log.details === 'object' 
                          ? JSON.stringify(log.details).substring(0, 50) + '...'
                          : String(log.details).substring(0, 50) + '...'
                        }
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Action</h4>
                              <Badge className={getActionColor(log.action)}>
                                {log.action.toUpperCase()}
                              </Badge>
                            </div>
                            <div>
                              <h4 className="font-medium">User ID</h4>
                              <code className="text-sm">{log.user_id}</code>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium">Timestamp</h4>
                            <p className="text-sm">{formatDateTime(log.created_at)}</p>
                          </div>
                          {log.details && (
                            <div>
                              <h4 className="font-medium mb-2">Details</h4>
                              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {sortedLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};