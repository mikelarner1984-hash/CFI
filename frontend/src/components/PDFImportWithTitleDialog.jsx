import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { importFromWord } from "@/lib/wordImport";
import { toast } from "sonner";

export const WordImportDialog = ({ open, onOpenChange, onImport }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isWord = selectedFile.name.endsWith('.docx') || 
                     selectedFile.name.endsWith('.doc') ||
                     selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     selectedFile.type === 'application/msword';
      
      if (isWord) {
        setFile(selectedFile);
        // Auto-generate title from filename
        const fileName = selectedFile.name.replace(/\.(docx|doc)$/i, '');
        setTitle(fileName);
      } else {
        toast.error("Please select a valid Word document (.docx or .doc)");
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for this dataset");
      return;
    }

    setIsProcessing(true);
    try {
      const entries = await importFromWord(file);
      if (entries.length > 0) {
        onImport(entries, title.trim());
        setFile(null);
        setTitle("");
      } else {
        toast.error("No valid entries found in document");
      }
    } catch (error) {
      toast.error("Error importing document: " + error.message);
      console.error("Import error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import from Word Document</DialogTitle>
          <DialogDescription>
            Upload a Word document (.docx) and give it a title to create a new dataset.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="dataset-title">Dataset Title *</Label>
            <Input
              id="dataset-title"
              type="text"
              placeholder="e.g., January 2024 - ML Rota"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This title will help you identify this dataset later
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="word-file">Word Document *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="word-file"
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
          </div>
          {file && (
            <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Expected Document Format:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Table with columns: Date, Time, Staff, Client (other staff), Activity</li>
              <li>Date format: "Day DD/M" (e.g., "Fri 2/1", "Mon 12/1")</li>
              <li>Time format: HH:MM-HH:MM (e.g., "09:00-11:00", "13:30-22:59")</li>
              <li>Client column should contain client names (e.g., "Argo, B", "Preece, D")</li>
              <li>Miles fields will default to 0 and can be edited after import</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || !title.trim() || isProcessing} className="gap-2">
            {isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import & Create Dataset
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
