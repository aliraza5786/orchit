export function getInitials(name: string) {
  if (!name) return;

  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2); // ✅ Only keep first two letters
}

export function generateAvatarColor(id: string | null, name: string): string {
  if (!id) {
    return '#6B7280';
  }

  const colors = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16'
  ];

  const hash = (id + name).split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}
