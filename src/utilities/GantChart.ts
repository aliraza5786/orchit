export function generateTimeline(start: string, end: string, stepDays = 7): string[] {
    const result: string[] = []
    const current = new Date(start)
    const endDate = new Date(end)
  
    while (current <= endDate) {
      result.push(new Date(current).toISOString().split('T')[0])
      current.setDate(current.getDate() + stepDays)
    }
    return result;
  }
  