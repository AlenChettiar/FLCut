import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  // Safely read the session token without loading Prisma or Bcrypt!
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  
  const { nextUrl } = req;
  const isAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

  if (isAuthPage) {
    if (isLoggedIn) {
      // Send them to the dashboard, they don't need to log in again!
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return null; 
  }

  // If they are anonymous and trying to access the dashboard
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return null;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/register"],
};
