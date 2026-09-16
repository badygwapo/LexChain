import { NextRequest, NextResponse } from "next/server";

export const ISSUER_MANAGEMENT_PATHS = [
  "/portal/users",
  "/portal/issuer-invitations",
  "/portal/audit-logs",
] as const;

const CONSOLIDATED_DASHBOARD_PATHS = new Set([
  "/portal/analytics",
  "/portal/system-statistics",
  "/portal/processing",
  "/portal/blockchain-records",
]);

const LEGACY_ADMIN_REDIRECTS: Record<string, string> = {
  "/admin/dashboard": "/portal/dashboard",
  "/admin/users": "/portal/users",
  "/admin/invitations-permissions": "/portal/issuer-invitations",
  "/admin/generated-reports": "/portal/reports",
  "/admin/audit-logs": "/portal/audit-logs",
  "/admin/login": "/login",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const issuerToken = request.cookies.get("issuer_token")?.value;
  const portalToken = request.cookies.get("portal_token")?.value;
  const isIssuerManagementPath = ISSUER_MANAGEMENT_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const destination = LEGACY_ADMIN_REDIRECTS[pathname] ?? "/portal/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (CONSOLIDATED_DASHBOARD_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  }

  if (pathname === "/portal/system-reports") {
    return NextResponse.redirect(new URL("/portal/reports", request.url));
  }

  if (isIssuerManagementPath) {
    if (!portalToken) return NextResponse.redirect(new URL("/login", request.url));
    if (!issuerToken) {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!portalToken && pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/login", "/register", "/forgot-password"],
};
