export function isoDate(date: Date | number): string {
  if (typeof date === 'number') date = new Date(date);
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function isInvalidDate(date: Date): boolean {
  return isNaN(date.getTime());
}
