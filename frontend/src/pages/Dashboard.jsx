import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkEntryDialog } from "@/components/WorkEntryDialog";
import { WorkTable } from "@/components/WorkTable";
import { PDFImportDialog } from "@/components/PDFImportDialog";
import { exportToPDF } from "@/lib/pdfExport";
import { Download, Upload, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

export const Dashboard = () => {
  const [entries, setEntries] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPDFImportOpen, setIsPDFImportOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("workTrackerEntries");
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading entries:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("workTrackerEntries", JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = (newEntry) => {
    if (editingEntry) {
      setEntries(entries.map(e => e.id === editingEntry.id ? { ...newEntry, id: editingEntry.id } : e));
      setEditingEntry(null);
      toast.success("Entry updated successfully");
    } else {
      setEntries([...entries, { ...newEntry, id: Date.now() }]);
      toast.success("Entry added successfully");
    }
    setIsAddDialogOpen(false);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setIsAddDialogOpen(true);
  };

  const handleDeleteEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
    toast.success("Entry deleted successfully");
  };

  const handleToggleWorked = (id, worked) => {
    setEntries(entries.map(e => e.id === id ? { ...e, worked } : e));
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(entries);
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Error exporting PDF");
      console.error("Export error:", error);
    }
  };

  const handleImportPDF = (importedEntries) => {
    setEntries([...entries, ...importedEntries]);
    setIsPDFImportOpen(false);
    toast.success(`Imported ${importedEntries.length} entries`);
  };

  const totals = useMemo(() => {
    // Only sum entries where worked is true
    const workedEntries = entries.filter(entry => entry.worked !== false);
    return workedEntries.reduce(
      (acc, entry) => ({
        totalHours: acc.totalHours + (entry.totalHours || 0),
        clientMiles: acc.clientMiles + (entry.clientMiles || 0),
        commuteMiles: acc.commuteMiles + (entry.commuteMiles || 0),
      }),
      { totalHours: 0, clientMiles: 0, commuteMiles: 0 }
    );
  }, [entries]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/cfi-logo.png" 
                alt="CFI Group - Caring for Individuals" 
                className="h-16 w-auto object-contain"
              />
              <div className="border-l pl-4">
                <h1 className="text-3xl font-semibold text-foreground">Work Tracker</h1>
                <p className="text-muted-foreground mt-1">Track your work hours and mileage</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setEditingEntry(null);
                  setIsAddDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
              <Button onClick={() => setIsPDFImportOpen(true)} variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import PDF
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="gap-2"
                disabled={entries.length === 0}
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totals.totalHours.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">CH Submitted only</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Client Miles</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totals.clientMiles.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">CH Submitted only</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Commute Miles</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totals.commuteMiles.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">CH Submitted only</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Work Entries</CardTitle>
            <CardDescription>View and manage all your work entries</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <WorkTable
              entries={entries}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onToggleWorked={handleToggleWorked}
            />
          </CardContent>
        </Card>
      </div>

      <WorkEntryDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddEntry}
        editingEntry={editingEntry}
      />

      <PDFImportDialog
        open={isPDFImportOpen}
        onOpenChange={setIsPDFImportOpen}
        onImport={handleImportPDF}
      />
    </div>
  );
};

export default Dashboard;
