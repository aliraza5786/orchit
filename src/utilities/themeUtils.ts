export const lightColors = [
  { color: '#EDEEF0', value: '#EDEEF0' },
  { color: '#3CBAFB', value: '#D4F0FF80' },
  { color: '#266FD4', value: '#B0BFD3' },
  { color: '#EEA832', value: '#EEA8321A' },
  { color: '#E82368', value: '#D7B0BE' },
  { color: '#202123ff', value: '#B1B2B2' },
  { color: '#4026D4', value: '#B6B0D3' },
  { color: '#0DDAB1', value: '#ABD4CC' },
  { color: '#1EA0DC', value: '#AFC9D5' },
  { color: '#2587BC', value: '#B0C4CE' }
]

export const darkColors = [
  { color: '#c1c1c9ff', value: '#1b1b1b' }, 
  { color: '#3CBAFB', value: '#D4F0FF80' },
  { color: '#266FD4', value: '#B0BFD3' },
  { color: '#EEA832', value: '#EEA8321A' },
  { color: '#E82368', value: '#D7B0BE' },
  { color: '#202123ff', value: '#B1B2B2' },
  { color: '#4026D4', value: '#B6B0D3' },
  { color: '#0DDAB1', value: '#ABD4CC' },
  { color: '#1EA0DC', value: '#AFC9D5' },
  { color: '#2587BC', value: '#B0C4CE' }
]

export function hexToRgba(hex: string, alpha = 0.3) {
  if (!hex || typeof hex !== 'string') return hex;
  let h = hex.trim();
  if (!h.startsWith('#')) return h;
  if (/^#([0-9a-f]{3})$/i.test(h)) {
    h = '#' + h.slice(1).split('').map(c => c + c).join('');
  }
  if (/^#([0-9a-f]{8})$/i.test(h)) h = '#' + h.slice(1, 7);
  if (!/^#([0-9a-f]{6})$/i.test(h)) return hex;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getWorkspaceBackground(variables: any, isDark: boolean) {
  const { theme, color } = variables || {};
  if (theme) {
    return `url(${theme})`;
  }
  
  const defaultLight = lightColors[0].value;
  const defaultDark = darkColors[0].value;
  
  let finalColor = color;
  
  // Apply fallback if no color is provided
  if (!finalColor) {
    finalColor = isDark ? defaultDark : defaultLight;
  } else {
    // Cross-theme default resolution (legacy support for simple theme switching)
    if (isDark && finalColor === defaultLight) finalColor = defaultDark;
    if (!isDark && finalColor === defaultDark) finalColor = defaultLight;
  }
  
  return hexToRgba(finalColor, 0.3);
}
