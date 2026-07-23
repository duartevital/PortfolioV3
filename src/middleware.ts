import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE_NAME, isSessionValid } from './lib/auth';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  const isGuardedAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';

  if (isGuardedAdminPage) {
    const session = context.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!isSessionValid(session)) {
      return context.redirect('/admin/login');
    }
  }

  return next();
});
