export function avatarColor(u: any) {
  const seed = (u._id || u.email || u.name || "")
    .split("")
    .reduce((a: number, c: string) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const palette = [
    "#8B5CF6",
    "#F59E0B",
    "#10B981",
    "#EF4444",
    "#3B82F6",
    "#EC4899",
    "#22D3EE",
    "#84CC16",
    "#FB7185",
    "#F97316",
  ];
  return palette[seed % palette.length];
}
