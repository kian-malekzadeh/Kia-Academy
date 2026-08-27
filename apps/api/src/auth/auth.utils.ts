export function parseExpiresInSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])?$/);
  if (!match) {
    const parsed = parseInt(expiresIn, 10);
    return Number.isFinite(parsed) ? parsed : 900;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] ?? 's';

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return value;
  }
}

export function addDurationToDate(expiresIn: string): Date {
  const seconds = parseExpiresInSeconds(expiresIn);
  return new Date(Date.now() + seconds * 1000);
}
