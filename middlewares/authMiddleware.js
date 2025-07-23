import { NextResponse } from 'next/server';

export const AuthMiddleware = (next) => {
  return async (req, _next) => {
    const unAuthenticateUrls = new RegExp('^/login/?$');
    const openUrls = new RegExp('^/(not-found|something-wrong)/?$');
    const token = req.cookies.get('auth_token');

    if (openUrls.test(req.url)) {
      const pathname = req.nextUrl.pathname;
      console.log(pathname);
      // return NextResponse.rewrite(new URL(
      //     `/${pathname}`,
      //     req.url
      // ))
    } else {
      if (unAuthenticateUrls.test(req.url)) {
        if (token) {
          const url = req.nextUrl.clone();
          url.pathname = `/`;
          return NextResponse.redirect(url);
        }
      } else {
        if (!token) {
          const url = req.nextUrl.clone();
          url.pathname = `/login`;
          url.searchParams.set(
            'redirect',
            req.nextUrl.pathname + req.nextUrl.search
          );
          return NextResponse.redirect(url);
        }
      }
    }

    return next(req, _next);
  };
};
