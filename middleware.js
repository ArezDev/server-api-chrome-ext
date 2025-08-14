// middleware.js (di root)
import { NextResponse } from 'next/server';
import { verifyToken } from './lib/verifyTokenEdge';

export async function middleware(request) {
  const token = request.cookies.get('balanesohib')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }

  const user = await verifyToken(token); // <-- pakai await karena jwtVerify async

  if (!user) {
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }

  const now = new Date();
  const accessUntil = new Date(user.akses);

  if (accessUntil < now) {
    return NextResponse.redirect(new URL('https://t.me/arezdev', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/me'],
};