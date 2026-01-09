export function formatDate(timestamp: string): string {
  const date = new Date(timestamp);

  // Options to extract only the month and date
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  // Format the date
  return date.toLocaleDateString("en-US", options);
}

export function extractYear(dateString: string) {
  const date = new Date(dateString); // Create a Date object from the input string
  return date.getFullYear(); // Return the year
}

export function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);

  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const strMinutes = minutes < 10 ? "0" + minutes : minutes;
  
  // Format: Sep 12, 2024 - 09.45 AM
  // Note: toLocaleDateString might return "Sep 12, 2024" or "Sep 12, 2024" depending on locale implementation detail, usually "Sep 12, 2024"
  
  return `${datePart} - ${hours.toString().padStart(2, '0')}:${strMinutes} ${ampm}`;
}
