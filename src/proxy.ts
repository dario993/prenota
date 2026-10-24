import { NextResponse, type NextRequest } from "next/server";

// Controllo veloce: solo presenza del cookie. La verifica vera è in src/lib/auth.ts.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("sessione")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)",
  ],
};
