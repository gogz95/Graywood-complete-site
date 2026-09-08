import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveDomainKey, DOMAIN_HEADER } from "@/lib/domain";

/**
 * proxy.ts — Multi-domain routing proxy (formerly middleware.ts).
 *
 * Reads the incoming `host` header, resolves it to a DomainKey, and
 * forwards it downstream via the `x-gw-domain` request header so that
 * Server Components / layouts can read it without touching the network.
 */
export function proxy(request: NextRequest) {
  // Disregard any client-supplied x-gw-domain header to prevent cross-domain spoofing
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const domainKey = resolveDomainKey(host);

  // Clone headers and inject our domain key & pathname
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(DOMAIN_HEADER, domainKey);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT:
     * - _next/static  (static chunks)
     * - _next/image   (image optimisation)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
