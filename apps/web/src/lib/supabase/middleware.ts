import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/auth/callback",
  "/auth/reset-password",
  "/",
  "/api/admin/bootstrap",
  "/student/login",
  "/student/register",
  "/student/forgot-password",
  "/student/verify-email",
  "/student/onboarding",
  "/student/terms",
];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(
    (p) =>
      path === p ||
      path.startsWith("/login") ||
      path.startsWith("/student/login") ||
      path.startsWith("/student/register") ||
      path.startsWith("/student/forgot-password") ||
      path.startsWith("/student/verify-email") ||
      path.startsWith("/student/onboarding") ||
      path.startsWith("/student/terms"),
  );
}

function isStudentAuthPath(path: string): boolean {
  return (
    path.startsWith("/student/login") ||
    path.startsWith("/student/register") ||
    path.startsWith("/student/forgot-password") ||
    path.startsWith("/student/verify-email") ||
    path.startsWith("/student/onboarding") ||
    path.startsWith("/student/terms")
  );
}

function isStudentAppPath(path: string): boolean {
  return path === "/student" || path.startsWith("/student/");
}

function isStaffDashboardPath(path: string): boolean {
  return path === "/dashboard" || path.startsWith("/dashboard/");
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in middleware",
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = isStudentAppPath(path) ? "/student/login" : "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role as string | undefined;
    const isStudent = role === "student";

    if (path === "/login" || path === "/student/login") {
      if (isStudent) {
        const url = request.nextUrl.clone();
        url.pathname = "/student";
        return NextResponse.redirect(url);
      }
      if (profile?.role && profile.role !== "student") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      // Auth cookie without a profile row (failed registration): allow login/register.
    }

    if (isStudent && isStaffDashboardPath(path)) {
      const url = request.nextUrl.clone();
      url.pathname = "/student";
      return NextResponse.redirect(url);
    }

    if (!isStudent && isStudentAppPath(path) && !isStudentAuthPath(path)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (
      isStudent &&
      isStudentAuthPath(path) &&
      path !== "/student/verify-email" &&
      path !== "/student/register"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/student";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
