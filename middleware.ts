import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// paths that should bypass the guard
const PUBLIC_PATHS = ["/login", "/auth/callback", "/denied"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  // allow Next.js internals and static files
  return pathname.startsWith("/_next") || pathname.startsWith("/static");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log("middleware invoked for", pathname);

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  try {
    // build a minimal supabase client to inspect the session.  we keep
    // the same environment variable names used elsewhere, but guard
    // against them being undefined so the middleware doesn't explode.
    // Uncomment to force an error and see how Next handles it:
    // throw new Error("artificial test error");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.error("middleware: missing supabase env vars");
      throw new Error("supabase config unavailable");
    }

    const supabase = createClient(url, key);

    const accessToken = req.cookies.get("sb-access-token")?.value;
    if (!accessToken) {
      // no session, redirect to login
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // check superadmin flag in profile table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_superadmin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_superadmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/denied";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (err) {
    // log full error for debugging; middleware failures produce a
    // generic 500, so we want visibility in the logs.
    console.error("middleware invocation failed", err);

    // fall back to redirecting to login rather than throwing
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

// tell Next which paths the middleware should run for
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
