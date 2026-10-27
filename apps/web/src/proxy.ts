import { NextResponse, type NextRequest } from "next/server";

const disabledPrefixes: string[] = [];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDisabled = disabledPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isDisabled) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next({
    request,
  });
}

export const middleware = proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/search|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
