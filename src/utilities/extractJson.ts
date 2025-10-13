export function extractJSONFromResponse(content: string): object | null {
    try {
      // Match the first {...} block, even if wrapped in ```json ... ```
      const match = content.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/)
  
      if (match) {
        const jsonString = match[1] || match[2]
        return JSON.parse(jsonString)
      }
    } catch (err) {
      console.error('JSON parsing failed:', err)
    }
  
    return null
  }
  