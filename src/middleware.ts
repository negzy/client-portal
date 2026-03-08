import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    const isAdmin = token.role === "ADMIN";
    const isClient = token.role === "CLIENT";

    if (path.startsWith("/admin") && !isAdmin)
      return NextResponse.redirect(new URL("/dashboard", req.url));
    if (path.startsWith("/dashboard") && isAdmin)
      return NextResponse.redirect(new URL("/admin", req.url));

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", path);
    return NextResponse.next({ request: { headers: requestHeaders } });
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/onboarding"],
};
