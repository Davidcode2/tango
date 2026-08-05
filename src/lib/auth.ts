import type { MyTNGSession } from './mytng';

const SESSION_COOKIE_NAME = 'tango_session';

export function getSessionFromRequest(request: Request): MyTNGSession | null {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/tango_session=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function createSessionCookie(session: MyTNGSession): string {
  const encoded = Buffer.from(JSON.stringify(session)).toString('base64');
  return `${SESSION_COOKIE_NAME}=${encoded}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
