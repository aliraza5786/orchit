export const priorityStyle = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500/40 text-white";
    case "medium":
      return "bg-yellow-500/40 text-white";
    case "low":
      return "bg-green-500/40 text-white";
    default:
      return "bg-gray-500/40 text-white";
  }
};
