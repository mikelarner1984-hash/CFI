export const calculateHours = (startTime, finishTime) => {
  if (!startTime || !finishTime) return 0;

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [finishHour, finishMinute] = finishTime.split(':').map(Number);

  let startMinutes = startHour * 60 + startMinute;
  let finishMinutes = finishHour * 60 + finishMinute;

  if (finishMinutes < startMinutes) {
    finishMinutes += 24 * 60;
  }

  const diffMinutes = finishMinutes - startMinutes;
  return diffMinutes / 60;
};

export const formatTime = (time) => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
};
