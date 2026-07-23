import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE_NAME, isSessionValid } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminRoute = pathname.startsWith('/admin');
  const isGuardedAdminPage = isAdminRoute && pathname !== '/admin/login';

  if (isGuardedAdminPage) {
    const session = context.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!isSessionValid(session)) {
      return context.redirect('/admin/login');
    }
  }

  const response = await next();

  if (isAdminRoute) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
});
