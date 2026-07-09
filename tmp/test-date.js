function getTimezoneOffsetForState(state) {
  if (!state) return '-03:00'; // Default to Brasília time
  const cleanState = state.trim().toUpperCase();
  switch (cleanState) {
    case 'AC':
      return '-05:00';
    case 'AM':
    case 'RO':
    case 'RR':
    case 'MS':
    case 'MT':
      return '-04:00';
    default:
      return '-03:00';
  }
}

function getFormattedDateForState(state, dateDelayMinutes = 5) {
  // Get current date
  const now = new Date();
  
  // Subtract delay to avoid SEFAZ clock synchronization issues
  if (dateDelayMinutes > 0) {
    now.setMinutes(now.getMinutes() - dateDelayMinutes);
  }

  // Get offset string (e.g. "-03:00")
  const offsetStr = getTimezoneOffsetForState(state);
  
  // Parse offset hours (e.g. -3, -4, -5)
  const offsetHours = parseInt(offsetStr.split(':')[0], 10);
  
  // Calculate the target local time by adding the offset hours to the UTC time
  const localTimeMs = now.getTime() + (offsetHours * 60 * 60 * 1000);
  const localDate = new Date(localTimeMs);
  
  // Formatted local date in ISO style without the Z
  const isoLocal = localDate.toISOString().replace(/\.\d+Z$/, '');
  
  return `${isoLocal}${offsetStr}`;
}

console.log("Date for RJ:", getFormattedDateForState("RJ"));
console.log("Date for AM:", getFormattedDateForState("AM"));
console.log("Date for AC:", getFormattedDateForState("AC"));
console.log("Date for default:", getFormattedDateForState());
