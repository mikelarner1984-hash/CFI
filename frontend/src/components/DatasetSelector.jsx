import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Trash2, FolderOpen } from "lucide-react";
import { useState } from "react";

export const DatasetSelector = ({ 
  datasets, 
  activeDatasetId, 
  onSelectDataset, 
  onCreateDataset, 
  onDeleteDataset 
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDatasetTitle, setNewDatasetTitle] = useState("");

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  const handleCreateDataset = () => {
    if (newDatasetTitle.trim()) {
      onCreateDataset(newDatasetTitle.trim());
      setNewDatasetTitle("");
      setIsCreateDialogOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 flex-1">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <Select value={activeDatasetId} onValueChange={onSelectDataset}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a dataset" />
          </SelectTrigger>
          <SelectContent>
            {datasets.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{dataset.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {dataset.entries.length} entries
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsCreateDialogOpen(true)}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        New Dataset
      </Button>

      {activeDataset && datasets.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Dataset Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDeleteDataset(activeDatasetId)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete Dataset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Dataset</DialogTitle>
            <DialogDescription>
              Create a new empty dataset to manually add entries.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Dataset Title</Label>
              <Input
                id="title"
                placeholder="e.g., February 2024 Work Log"
                value={newDatasetTitle}
                onChange={(e) => setNewDatasetTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateDataset()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDataset} disabled={!newDatasetTitle.trim()}>
              Create Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
