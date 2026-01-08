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
import { Switch } from "@/components/ui/switch";
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
    
    let adjustedDate = formData.date;
    let adjustedStartTime = formData.startTime;
    let adjustedFinishTime = formData.finishTime;
    
    // If start time is 23:00, move it forward 1 hour to 00:00 and add 1 day to date
    if (formData.startTime === '23:00') {
      adjustedStartTime = '00:00';
      
      // Add 1 day to the date
      const currentDate = new Date(formData.date);
      currentDate.setDate(currentDate.getDate() + 1);
      adjustedDate = currentDate.toISOString().split('T')[0];
      
      console.log('Adjusted 23:00 start time:');
      console.log('  Original date:', formData.date);
      console.log('  New date:', adjustedDate);
      console.log('  Original start time:', formData.startTime);
      console.log('  New start time:', adjustedStartTime);
    }
    
    // If finish time is 07:00, move it forward 1 hour to 08:00
    if (formData.finishTime === '07:00') {
      adjustedFinishTime = '08:00';
      
      console.log('Adjusted 07:00 finish time:');
      console.log('  Original finish time:', formData.finishTime);
      console.log('  New finish time:', adjustedFinishTime);
    }
    
    // If finish time is 22:59, move it forward 1 hour to 23:59
    if (formData.finishTime === '22:59') {
      adjustedFinishTime = '23:59';
      
      console.log('Adjusted 22:59 finish time:');
      console.log('  Original finish time:', formData.finishTime);
      console.log('  New finish time:', adjustedFinishTime);
    }
    
    const entry = {
      date: adjustedDate,
      client: formData.client,
      startTime: adjustedStartTime,
      finishTime: adjustedFinishTime,
      totalHours: calculateHours(adjustedStartTime, adjustedFinishTime),
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
            {formData.startTime === '23:00' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Start Time Auto-adjustment</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Start time will be changed to 00:00 and date will move to the next day when saved.
                  </p>
                </div>
              </div>
            )}
            {formData.finishTime === '07:00' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Finish Time Auto-adjustment</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Finish time will be changed to 08:00 when saved.
                  </p>
                </div>
              </div>
            )}
            {formData.finishTime === '22:59' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Finish Time Auto-adjustment</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Finish time will be changed to 23:59 when saved.
                  </p>
                </div>
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
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="worked" className="text-base">CH Submitted</Label>
                <p className="text-sm text-muted-foreground">
                  Mark if this entry has been submitted
                </p>
              </div>
              <Switch
                id="worked"
                checked={formData.worked}
                onCheckedChange={(checked) => setFormData({ ...formData, worked: checked })}
              />
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
