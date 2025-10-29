export function getStatusStyle(s: any) {
  const status = s.trim().toLowerCase();
  switch (status) {
    case "pending":
      return "bg-amber-600/10 text-amber-600";
    case "in progress":
      return "bg-blue-600/10 text-blue-600  border-blue-600 ";
    case "to do":
      return "bg-gray-600/10 text-gray-600 border-gray-600";
    case "done":
      return "bg-green-600/10 text-green-600  border-green-600";
    case "accepted":
      return "bg-green-600/10 text-green-600  ";
    case "rejected":
      return "bg-red-600/10 text-red-600";
    default:
      break;
  }
}
