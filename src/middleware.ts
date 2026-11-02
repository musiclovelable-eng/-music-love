import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nightvolt-secret-key-2025'
);
const SESSION_COOKIE = 'music_love_session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Защищённые маршруты
  const isArtistRoute = request.nextUrl.pathname.startsWith('/artist');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  if (isArtistRoute || isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Проверка прав доступа для админки
      if (isAdminRoute && !payload.isAdmin) {
        return NextResponse.redirect(new URL('/artist/dashboard', request.url));
      }

      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Если пользователь авторизован и пытается зайти на главную страницу
  if (request.nextUrl.pathname === '/' && token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (payload.isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/artist/dashboard', request.url));
      }
    } catch {
      // Токен невалидный, продолжаем на главную
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/artist/:path*', '/admin/:path*'],
};
