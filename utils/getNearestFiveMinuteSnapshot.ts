// utils/getNearestFiveMinuteSnapshot.ts
export function getNearestFiveMinuteSnapshot(date: Date): string {
  const rounded = new Date(date);
  rounded.setUTCSeconds(0);
  rounded.setUTCMilliseconds(0);

  const minutes = rounded.getUTCMinutes();
  rounded.setUTCMinutes(minutes - (minutes % 5));

  return rounded.toISOString();
}

