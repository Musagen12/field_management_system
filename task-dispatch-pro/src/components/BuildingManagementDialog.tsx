import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getBuildings, createBuilding, deleteBuilding, Building } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw, Building2 } from 'lucide-react';

interface BuildingManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

export const BuildingManagementDialog = ({ open, onOpenChange, embedded = false }: BuildingManagementDialogProps) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (open || embedded) {
      loadBuildings();
    }
  }, [open, embedded]);

  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      const data = await getBuildings();
      setBuildings(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load buildings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a building name",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createBuilding(name.trim());
      toast({
        title: "Success",
        description: "Building created successfully",
      });
      setName('');
      setShowForm(false);
      loadBuildings();
    } catch (error) {
      // Error handled by API layer
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    try {
      await deleteBuilding(buildingId);
      toast({
        title: "Success",
        description: "Building deleted",
      });
      loadBuildings();
    } catch (error) {
      // Error handled by API layer
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadBuildings}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button 
          size="sm" 
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Building
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateBuilding} className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="building-name">Building Name</Label>
            <Input
              id="building-name"
              placeholder="Enter building name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setName('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Building'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading buildings...</p>
        </div>
      ) : buildings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No buildings found. Create one to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buildings.map((building) => (
              <TableRow key={building.id}>
                <TableCell className="font-medium">{building.name}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBuilding(building.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );

  if (embedded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Manage Buildings
          </CardTitle>
          <CardDescription>Create and manage buildings for your facilities</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Manage Buildings
          </DialogTitle>
          <DialogDescription>
            Create and manage buildings for your facilities
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
