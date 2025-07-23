import { NextResponse } from 'next/server';
import { AuthMiddleware } from '../middlewares/authMiddleware';
// import { LanguageMiddleware } from "./middlewares/langMiddleware";

// export function middleware(request) {
//   console.log('im here !!!!!');
//   // Get the session cookie from the request
//   const token = request.cookies.get('auth_token');

//   // If the cookie is missing, redirect to the login page
//   if (!token) {
//     // Store the URL the user was trying to access
//     const url = request.nextUrl.clone();
//     url.pathname = '/login';

//     // Redirect to the login page
//     return NextResponse.redirect(url);
//   }

//   // If the cookie exists, allow the request to proceed
//   return NextResponse.next();
// }

export const config = {
  matcher: '/((?!api|_next/static|_next/images|images|svgs|favicon.ico).*)',
};
export function defaultMiddleware(request) {
  return NextResponse.next();
}
export default AuthMiddleware(defaultMiddleware);
