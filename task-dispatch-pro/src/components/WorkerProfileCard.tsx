import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { authStorage } from '@/lib/auth';
import { updateWorkerPassword } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { User, Key, Calendar } from 'lucide-react';

export const WorkerProfileCard = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const user = authStorage.getUser();

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a new password",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Passwords do not match",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateWorkerPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="text-lg font-medium">{user.username}</div>
          </div>
          
          <div className="space-y-2">
            <Label>Role</Label>
            <Badge variant="secondary" className="w-fit">
              {user.role}
            </Badge>
          </div>

          {user.status && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Badge 
                variant={user.status === 'active' ? 'default' : 'destructive'} 
                className="w-fit"
              >
                {user.status}
              </Badge>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Member Since</Label>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-warning" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};