export function isRefreshResponseForCurrentSession(
  requestedRefreshToken: string,
  currentRefreshToken: string | null,
): boolean {
  return requestedRefreshToken === currentRefreshToken;
}
