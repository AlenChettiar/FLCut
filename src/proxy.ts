import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isAuthPage =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

  if (isAuthPage) {
    if (isLoggedIn) {
      // Already logged in, send them home
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    // Not logged in, let them see the auth pages
    return NextResponse.next();
  }

  // Protected route and not logged in — send to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/dashboard/:path+", "/login", "/register"],
};
