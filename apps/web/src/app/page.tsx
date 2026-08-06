import Link from "next/link";
import { Calendar, QrCode, Users, BarChart3 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { PhoneStudentRedirect } from "@/components/student/PhoneStudentRedirect";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <PhoneStudentRedirect />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandLogo variant="transparent" className="max-h-14" priority />
        <div className="flex items-center gap-3">
          <Link
            href="/student/login"
            className="hidden rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 sm:inline-flex"
          >
            Student Portal
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Staff Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12 flex justify-center md:hidden">
          <BrandLogo variant="transparent" className="max-h-28" />
        </div>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
          QR Event Attendance with Location &amp; Selfie Verification
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-300">
          Post events on a shared calendar, generate unique QR codes, and let
          students check in from the mobile app or phone browser with GPS and
          live selfie capture.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/student/login"
            className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-400 sm:hidden"
          >
            Student sign in
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Staff sign in
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Calendar,
              title: "Event Calendar",
              desc: "Faculty & org members schedule events with venue geofencing.",
            },
            {
              icon: QrCode,
              title: "Unique QR Codes",
              desc: "Each event gets its own scannable QR for attendance.",
            },
            {
              icon: Users,
              title: "Role-Based Access",
              desc: "Admins, faculty, organizations, and students each have tailored views.",
            },
            {
              icon: BarChart3,
              title: "Reports",
              desc: "Faculty generate attendance reports with timestamps & selfies.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <Icon className="mb-3 h-8 w-8 text-blue-400" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-300">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
