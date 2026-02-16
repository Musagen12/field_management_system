import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFacilities, createFacility, deleteFacility, getBuildings, Facility, Building } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw, Warehouse } from 'lucide-react';

interface FacilityManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

export const FacilityManagementDialog = ({ open, onOpenChange, embedded = false }: FacilityManagementDialogProps) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');

  useEffect(() => {
    if (open || embedded) {
      loadData();
    }
  }, [open, embedded]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [facilitiesData, buildingsData] = await Promise.all([
        getFacilities(),
        getBuildings()
      ]);
      setFacilities(facilitiesData);
      setBuildings(buildingsData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !selectedBuildingId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a facility name and select a building",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createFacility(name.trim(), selectedBuildingId);
      toast({
        title: "Success",
        description: "Facility created successfully",
      });
      setName('');
      setSelectedBuildingId('');
      setShowForm(false);
      loadData();
    } catch (error) {
      // Error handled by API layer
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteFacility = async (facilityId: string) => {
    try {
      await deleteFacility(facilityId);
      toast({
        title: "Success",
        description: "Facility deleted",
      });
      loadData();
    } catch (error) {
      // Error handled by API layer
    }
  };

  const getBuildingName = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || buildingId;
  };

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button 
          size="sm" 
          onClick={() => setShowForm(!showForm)}
          disabled={buildings.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Facility
        </Button>
      </div>

      {buildings.length === 0 && !isLoading && (
        <div className="text-center py-4 text-muted-foreground bg-muted/50 rounded-lg">
          Please create a building first before adding facilities.
        </div>
      )}

      {showForm && buildings.length > 0 && (
        <form onSubmit={handleCreateFacility} className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="facility-name">Facility Name</Label>
            <Input
              id="facility-name"
              placeholder="Enter facility name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="building">Building</Label>
            <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a building" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setName('');
                setSelectedBuildingId('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Facility'}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground text-sm">Loading facilities...</p>
        </div>
      ) : facilities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No facilities found. Create one to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Building</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.map((facility) => (
              <TableRow key={facility.id}>
                <TableCell className="font-medium">{facility.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {facility.building_name || getBuildingName(facility.building_id)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFacility(facility.id)}
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
            <Warehouse className="h-5 w-5" />
            Manage Facilities
          </CardTitle>
          <CardDescription>Create and manage facilities within buildings</CardDescription>
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
            <Warehouse className="h-5 w-5" />
            Manage Facilities
          </DialogTitle>
          <DialogDescription>
            Create and manage facilities within buildings
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
