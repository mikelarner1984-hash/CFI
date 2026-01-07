import { useState, useEffect } from "react";
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
import { calculateHours } from "@/lib/timeUtils";

export const WorkEntryDialog = ({ open, onOpenChange, onSave, editingEntry }) => {
  const [formData, setFormData] = useState({
    date: "",
    client: "",
    startTime: "",
    finishTime: "",
    clientMiles: "",
    commuteMiles: "",
    worked: true,
  });

  const [calculatedHours, setCalculatedHours] = useState(0);

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        date: editingEntry.date,
        client: editingEntry.client || "",
        startTime: editingEntry.startTime,
        finishTime: editingEntry.finishTime,
        clientMiles: editingEntry.clientMiles.toString(),
        commuteMiles: editingEntry.commuteMiles.toString(),
        worked: editingEntry.worked !== undefined ? editingEntry.worked : true,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        client: "",
        startTime: "",
        finishTime: "",
        clientMiles: "",
        commuteMiles: "",
        worked: true,
      });
    }
  }, [editingEntry, open]);

  useEffect(() => {
    if (formData.startTime && formData.finishTime) {
      const hours = calculateHours(formData.startTime, formData.finishTime);
      setCalculatedHours(hours);
    } else {
      setCalculatedHours(0);
    }
  }, [formData.startTime, formData.finishTime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const entry = {
      date: formData.date,
      client: formData.client,
      startTime: formData.startTime,
      finishTime: formData.finishTime,
      totalHours: calculatedHours,
      clientMiles: parseFloat(formData.clientMiles) || 0,
      commuteMiles: parseFloat(formData.commuteMiles) || 0,
      worked: formData.worked,
    };

    onSave(entry);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      client: "",
      startTime: "",
      finishTime: "",
      clientMiles: "",
      commuteMiles: "",
      worked: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingEntry ? "Edit Entry" : "Add Work Entry"}</DialogTitle>
          <DialogDescription>
            {editingEntry ? "Update the work entry details below." : "Enter your work details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                type="text"
                placeholder="Enter client name"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="finishTime">Finish Time</Label>
                <Input
                  id="finishTime"
                  type="time"
                  value={formData.finishTime}
                  onChange={(e) => setFormData({ ...formData, finishTime: e.target.value })}
                  required
                />
              </div>
            </div>
            {calculatedHours > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  Total Hours: <span className="text-primary">{calculatedHours.toFixed(2)}</span>
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clientMiles">Client Miles</Label>
                <Input
                  id="clientMiles"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.clientMiles}
                  onChange={(e) => setFormData({ ...formData, clientMiles: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commuteMiles">Commute Miles</Label>
                <Input
                  id="commuteMiles"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={formData.commuteMiles}
                  onChange={(e) => setFormData({ ...formData, commuteMiles: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingEntry ? "Update" : "Add"} Entry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
