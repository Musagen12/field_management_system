import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitWorkerComplaint } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { MapPin, Paperclip } from 'lucide-react';

interface ComplaintCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplaintCreated: () => void;
}

export const ComplaintCreateDialog = ({ open, onOpenChange, onComplaintCreated }: ComplaintCreateDialogProps) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const complaintCategories = [
    { value: 'poor_quality', label: 'Poor Quality' },
    { value: 'delay', label: 'Delay' },
    { value: 'misconduct', label: 'Misconduct' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast({
            title: "Location captured",
            description: "Current location has been added to your complaint",
          });
        },
        (error) => {
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not get your current location",
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Geolocation is not supported by this browser",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !category) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide a description and category",
      });
      return;
    }

    setIsLoading(true);
    try {
      await submitWorkerComplaint(description);
      
      toast({
        title: "Success",
        description: "Complaint submitted successfully",
      });
      
      setDescription('');
      setCategory('');
      setLocation('');
      setSelectedFile(null);
      onOpenChange(false);
      onComplaintCreated();
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
          <DialogTitle>Submit Complaint</DialogTitle>
          <DialogDescription>
            Report an issue or concern with optional file attachment and location
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue or concern"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select complaint category" />
              </SelectTrigger>
              <SelectContent>
                {complaintCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                placeholder="Enter location or coordinates"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={getCurrentLocation}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">Attachment (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
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
              {isLoading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};