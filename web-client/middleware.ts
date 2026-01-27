import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isLoginPage = req.nextUrl.pathname.startsWith("/login");

        // If logged in and on login page, go to dashboard
        if (isLoginPage) {
            if (isAuth) {
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
            return null;
        }

        // Require Auth for protected routes
        if (!isAuth) {
            let from = req.nextUrl.pathname;
            if (req.nextUrl.search) {
                from += req.nextUrl.search;
            }
            return NextResponse.redirect(
                new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
            );
        }

        // Admin Protection (Bypassed locally for UI check, TODO: Re-enable)
        if (req.nextUrl.pathname.startsWith("/admin")) {
            // if (token?.role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => {
                // Return true to handle redirects in middleware function manually
                // This prevents NextAuth's default redirect to /api/auth/signin
                return true;
            }
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};
