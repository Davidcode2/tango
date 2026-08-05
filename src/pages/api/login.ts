import type { APIRoute } from 'astro';
import { login } from '../../lib/mytng';
import { createSessionCookie } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Benutzername und Passwort erforderlich' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await login(username, password);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Login fehlgeschlagen' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': createSessionCookie(session),
    },
  });
};
