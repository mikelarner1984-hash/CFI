import { calculateHours } from './timeUtils';

export const mergeIdenticalEntries = (entries) => {
  if (!entries || entries.length === 0) return [];

  console.log('Starting merge process for', entries.length, 'entries');

  // Group entries by date + client combination
  const groups = {};
  
  entries.forEach(entry => {
    const key = `${entry.date}_${(entry.client || '').toLowerCase().trim()}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
  });

  const mergedEntries = [];

  Object.keys(groups).forEach(key => {
    const group = groups[key];
    
    if (group.length === 1) {
      // No duplicates, keep as is
      mergedEntries.push(group[0]);
    } else {
      // Multiple entries with same date and client - merge them
      console.log(`Merging ${group.length} entries for key: ${key}`);
      
      // Sort by start time to get earliest and latest
      const sortedByStart = [...group].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
      
      const sortedByFinish = [...group].sort((a, b) => {
        return b.finishTime.localeCompare(a.finishTime);
      });
      
      const earliestStart = sortedByStart[0].startTime;
      const latestFinish = sortedByFinish[0].finishTime;
      
      // Sum the miles
      const totalClientMiles = group.reduce((sum, e) => sum + (e.clientMiles || 0), 0);
      const totalCommuteMiles = group.reduce((sum, e) => sum + (e.commuteMiles || 0), 0);
      
      // Create merged entry
      const mergedEntry = {
        ...group[0], // Keep base data from first entry
        startTime: earliestStart,
        finishTime: latestFinish,
        totalHours: calculateHours(earliestStart, latestFinish),
        clientMiles: totalClientMiles,
        commuteMiles: totalCommuteMiles,
      };
      
      console.log('Merged entry:', {
        date: mergedEntry.date,
        client: mergedEntry.client,
        original_count: group.length,
        startTime: earliestStart,
        finishTime: latestFinish,
        totalHours: mergedEntry.totalHours,
        clientMiles: totalClientMiles,
        commuteMiles: totalCommuteMiles
      });
      
      mergedEntries.push(mergedEntry);
    }
  });

  console.log(`Merge complete: ${entries.length} entries -> ${mergedEntries.length} entries`);
  
  return mergedEntries;
};
