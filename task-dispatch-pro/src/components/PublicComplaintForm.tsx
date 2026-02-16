import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createComplaint } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { MapPin, Upload, AlertTriangle } from 'lucide-react';

export const PublicComplaintForm = () => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Geolocation is not supported by this browser",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude}, ${longitude}`);
        setIsGettingLocation(false);
        toast({
          title: "Location captured",
          description: "Your current location has been added to the complaint",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          variant: "destructive",
          title: "Location error",
          description: "Unable to get your current location",
        });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !category) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in description and category",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createComplaint(description, category, location || undefined, selectedFile || undefined);
      
      // Reset form
      setDescription('');
      setCategory('');
      setLocation('');
      setSelectedFile(null);
      
      toast({
        title: "Complaint submitted",
        description: "Your complaint has been submitted successfully. We will review it and get back to you.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit complaint",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-xl">Submit a Complaint</CardTitle>
            <CardDescription>
              Report issues with our field service operations. We'll investigate and respond promptly.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select complaint category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="poor_quality">Poor Quality</SelectItem>
                <SelectItem value="delay">Delay</SelectItem>
                <SelectItem value="misconduct">Misconduct</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
              >
                <MapPin className="w-4 h-4" />
                {isGettingLocation ? 'Getting...' : 'Get Location'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Evidence (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept="image/*,video/*,.pdf,.doc,.docx"
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};