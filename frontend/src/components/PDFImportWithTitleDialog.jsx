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
import { importFromPDF } from "@/lib/pdfImport";
import { toast } from "sonner";

export const PDFImportWithTitleDialog = ({ open, onOpenChange, onImport }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      // Auto-generate title from filename
      const fileName = selectedFile.name.replace('.pdf', '');
      setTitle(fileName);
    } else {
      toast.error("Please select a valid PDF file");
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
      const entries = await importFromPDF(file);
      if (entries.length > 0) {
        onImport(entries, title.trim());
        setFile(null);
        setTitle("");
      } else {
        toast.error("No valid entries found in PDF");
      }
    } catch (error) {
      toast.error("Error importing PDF: " + error.message);
      console.error("Import error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import from PDF</DialogTitle>
          <DialogDescription>
            Upload a PDF file and give it a title to create a new dataset.
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
            <Label htmlFor="pdf-file">PDF File *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
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
            <p className="text-sm font-medium">Expected PDF Format:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Table with columns: Date, Time, Client (other staff)</li>
              <li>Date format: MM/DD/YYYY or similar</li>
              <li>Time format: HH:MM-HH:MM (e.g., "9:00-17:00" or "9:00 AM - 5:00 PM")</li>
              <li>Client column should contain client/staff names</li>
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
