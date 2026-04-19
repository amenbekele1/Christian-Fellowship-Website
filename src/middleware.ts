import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Guardian-only admin routes — service teams get specific sub-routes
    const serviceTeams = (token?.serviceTeams as string[]) ?? [];
    const isLibrarian     = serviceTeams.includes("LIBRARIAN");
    const isWebsiteEditor = serviceTeams.includes("WEBSITE_EDITOR");

    const librarianRoutes     = ["/dashboard/admin/books"];
    const websiteEditorRoutes = [
      "/dashboard/admin/content",
      "/dashboard/admin/events",
      "/dashboard/admin/programs",
      "/dashboard/admin/announcements",
    ];

    const isAllowedLibrarian     = isLibrarian     && librarianRoutes.some(r => path.startsWith(r));
    const isAllowedWebsiteEditor = isWebsiteEditor && websiteEditorRoutes.some(r => path.startsWith(r));

    if (
      path.startsWith("/dashboard/admin") &&
      token?.role !== "GUARDIAN" &&
      !isAllowedLibrarian &&
      !isAllowedWebsiteEditor
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
