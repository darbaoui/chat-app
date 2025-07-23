import { NextResponse } from 'next/server';
import { AuthMiddleware } from '../middlewares/authMiddleware';

export const config = {
  matcher: '/((?!api|_next/static|_next/images|images|svgs|favicon.ico).*)',
};
export function defaultMiddleware(request) {
  return NextResponse.next();
}
export default AuthMiddleware(defaultMiddleware);
