import { NextResponse } from 'next/server';

const unAuthenticateUrls = /^\/login\/?$/;
const openUrls = /^\/(not-found|something-wrong)\/?$/;

export const AuthMiddleware = (next) => {
  return async (req, _next) => {
    const token = req.cookies.get('auth_token');
    if (openUrls.test(req.nextUrl.pathname)) {
      const pathname = req.nextUrl.pathname;
      // console.log(pathname);
      // return NextResponse.rewrite(new URL(
      //     `/${pathname}`,
      //     req.url
      // ))
    } else {
      if (unAuthenticateUrls.test(req.nextUrl.pathname)) {
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
