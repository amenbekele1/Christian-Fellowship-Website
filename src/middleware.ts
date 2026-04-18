import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Guardian-only admin routes
    // Exception: Librarians may access the library management page
    const serviceTeams = (token?.serviceTeams as string[]) ?? [];
    const isLibrarian = serviceTeams.includes("LIBRARIAN");
    const isLibraryRoute = path.startsWith("/dashboard/admin/books");

    if (
      path.startsWith("/dashboard/admin") &&
      token?.role !== "GUARDIAN" &&
      !(isLibrarian && isLibraryRoute)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
