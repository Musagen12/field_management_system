import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { submitWorkerComplaint } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface WorkerComplaintFormProps {
  onComplaintSubmitted?: () => void;
}

export const WorkerComplaintForm = ({ onComplaintSubmitted }: WorkerComplaintFormProps) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a description for your complaint",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitWorkerComplaint(description);
      toast({
        title: "Success",
        description: "Your complaint has been submitted successfully",
      });
      setDescription('');
      onComplaintSubmitted?.();
    } catch (error) {
      // Error already handled by API layer
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Employee Complaint</CardTitle>
        <CardDescription>
          Submit a complaint about workplace issues. Your complaint will be reviewed by administrators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your complaint in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32"
              required
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Complaint
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};