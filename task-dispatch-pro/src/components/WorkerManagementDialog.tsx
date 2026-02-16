import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addWorker } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface WorkerManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkerAdded: () => void;
}

export const WorkerManagementDialog = ({ open, onOpenChange, onWorkerAdded }: WorkerManagementDialogProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !phone) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addWorker(username, password, phone);
      
      toast({
        title: "Success",
        description: "Worker added and phone verification sent successfully",
      });
      
      setUsername('');
      setPassword('');
      setPhone('');
      onOpenChange(false);
      onWorkerAdded();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add worker';
      
      // Provide specific error messages for phone verification issues
      if (errorMessage.includes('phone') || errorMessage.includes('verification') || errorMessage.includes('SMS')) {
        toast({
          variant: "destructive",
          title: "Phone Verification Failed",
          description: "Unable to send verification message to the provided phone number. Please verify the number is correct and has SMS capability.",
        });
      } else if (errorMessage.includes('duplicate') || errorMessage.includes('exists')) {
        toast({
          variant: "destructive",
          title: "Worker Already Exists",
          description: "A worker with this username or phone number already exists.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error Adding Worker",
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>
            Create a new worker account
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter phone number (e.g., +254720368136)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
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
              {isLoading ? 'Adding...' : 'Add Worker'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};