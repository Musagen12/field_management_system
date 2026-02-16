import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Camera, Check, Upload } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  photo_url?: string;
}

interface ActiveTaskCardProps {
  task: Task;
  onStatusUpdate: (taskId: string, status: string) => void;
  onPhotoUpload: (taskId: string, files: File[]) => void;
}

export const ActiveTaskCard = ({ task, onStatusUpdate, onPhotoUpload }: ActiveTaskCardProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...urls]);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAcknowledge = () => {
    onStatusUpdate(task.id, 'acknowledged');
  };

  const handleComplete = async () => {
    if (selectedFiles.length === 0) {
      alert('Please upload at least one photo before completing the task');
      return;
    }

    setIsUploading(true);
    try {
      await onPhotoUpload(task.id, selectedFiles);
      onStatusUpdate(task.id, 'completed');
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{task.title}</CardTitle>
            <CardDescription className="mt-2">{task.description}</CardDescription>
          </div>
          <StatusBadge status={task.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Assigned on {new Date(task.created_at).toLocaleDateString()}
        </div>

        {task.status === 'pending' && (
          <div className="flex gap-4">
            <Button onClick={handleAcknowledge} variant="outline">
              <Check className="mr-2 h-4 w-4" />
              Acknowledge Task
            </Button>
          </div>
        )}

        {task.status === 'in_progress' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Upload Completion Photos</h4>
              <p className="text-sm text-muted-foreground mb-2">You can upload multiple evidence photos</p>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="flex-1"
                  multiple
                />
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {previewUrls.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Preview ({selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''}):</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Task completion preview ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleComplete}
              disabled={selectedFiles.length === 0 || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Task
                </>
              )}
            </Button>
          </div>
        )}

        {task.photo_url && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Completion Photo:</h5>
            <img 
              src={task.photo_url} 
              alt="Task completion" 
              className="max-w-full h-48 object-cover rounded-md border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};