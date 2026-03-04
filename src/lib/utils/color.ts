/**
 * Converts a hex color string to an rgba string with the specified opacity.
 * Supports both #RGB and #RRGGBB formats.
 * 
 * @param hex - The hex color string (e.g., "#ff6b6b" or "#f6b")
 * @param opacity - The opacity value between 0 and 1
 * @returns An rgba color string
 */
export function getTranslucentColor(hex: string | undefined, opacity: number): string {
  if (!hex) return `rgba(163, 141, 109, ${opacity})`; // Default PoE Gold fallback
  
  let r = 0, g = 0, b = 0;
  
  // Remove hash if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    // If invalid format, return a safe fallback
    return `rgba(163, 141, 109, ${opacity})`;
  }
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
