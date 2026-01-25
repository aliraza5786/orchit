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
