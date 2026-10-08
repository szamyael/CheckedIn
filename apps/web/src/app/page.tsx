import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  CheckCheck,
  MapPin,
  QrCode,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";
import { PhoneStudentRedirect } from "@/components/student/PhoneStudentRedirect";

const features = [
  {
    icon: QrCode,
    title: "Fast, event-specific check-in",
    description:
      "Give every event its own QR code so students can check in with a quick scan.",
  },
  {
    icon: ShieldCheck,
    title: "Verification with context",
    description:
      "Use location, OTP, and selfie checks to make attendance verification clear.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "A live view for staff",
    description:
      "Follow attendance as it arrives, then review participation and event reports.",
  },
];

const steps = [
  ["01", "Set up the event", "Create the event and choose the attendance checks it needs."],
  ["02", "Share the check-in", "Display an event QR code for students to scan in the app."],
  ["03", "Follow participation", "Monitor arrivals live and use clear records after the event."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#14243a]">
      <PhoneStudentRedirect />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <Link href="/" aria-label="CheckedIn home" className="inline-flex items-center gap-2.5">
          <BrandMark size={42} />
          <span className="text-lg font-bold tracking-tight text-[#102a50]">
            Checked<span className="text-[#0eb89a]">In</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Portal navigation">
          <Link
            href="/student/login"
            className="hidden min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-[#36516d] transition hover:bg-[#eaf0f7] sm:inline-flex"
          >
            Student portal
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#12366a] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d2a54] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12366a] focus-visible:ring-offset-2"
          >
            Staff sign in
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <section className="relative isolate border-y border-[#e1e9f2] bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_10%,_#dff4f2_0%,_transparent_36%),linear-gradient(180deg,#fff_0%,#f7f9fc_100%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-12 lg:py-20">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#dce9f4] bg-white px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#31577f] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#0eb89a]" aria-hidden="true" />
              CAMPUS EVENTS, CONNECTED
            </p>
            <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.045em] text-[#102a50] sm:text-5xl lg:text-[3.65rem]">
              Attendance that keeps{" "}
              <span className="text-[#087d79]">campus moving.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#586b80] sm:text-lg sm:leading-8">
              Bring event check-in, clear verification, and student engagement
              together in one campus-ready platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/student/login"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#12366a] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(18,54,106,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0d2a54] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12366a] focus-visible:ring-offset-2"
              >
                Open student portal
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d7e1ec] bg-white px-5 text-sm font-semibold text-[#17395f] transition hover:border-[#9fb5cb] hover:bg-[#f7fafd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12366a] focus-visible:ring-offset-2"
              >
                Explore the staff workspace
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#64778c]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCheck size={15} className="text-[#098b75]" aria-hidden="true" />
                QR event check-in
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-[#098b75]" aria-hidden="true" />
                Configurable verification
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-[#d9eefa] blur-2xl" aria-hidden="true" />
            <div className="relative aspect-[2.4/1] overflow-hidden rounded-[1.75rem] border border-[#d5e3ef] bg-white shadow-[0_24px_70px_rgba(29,65,105,0.18)]">
              <Image
                src="/logos/checkedin-banner.png"
                alt="CheckedIn campus event and attendance platform illustration"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e4ebf2] bg-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-14 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14 lg:px-12 lg:py-20">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#087d79]">MADE FOR CAMPUS LIFE</p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-tight text-[#102a50] sm:text-4xl">
              The details matter. The experience should feel simple.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#617389]">
              Give students a straightforward way to participate and staff the
              information to manage events with confidence.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="group rounded-2xl border border-[#e1e9f1] bg-[#fbfcfe] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#b8d5df] hover:bg-white hover:shadow-[0_12px_30px_rgba(20,55,87,0.08)] sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8f5f3] text-[#087d79] transition group-hover:bg-[#d9f0ec]">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-[#9aabba]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-base font-semibold leading-6 text-[#17395f]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#617389]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 rounded-[1.75rem] bg-[#102e59] p-6 text-white shadow-[0_18px_50px_rgba(16,46,89,0.15)] sm:p-9 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-14 lg:p-12">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[#a7d9d2]">
              <UsersRound size={15} aria-hidden="true" />
              FROM CHECK-IN TO PARTICIPATION
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              One smoother flow for the whole event.
            </h2>
            <p className="mt-4 text-sm leading-7 text-blue-100/80">
              Keep setup simple, make check-in clear, and turn attendance into
              meaningful campus participation.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <li
                key={number}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5"
              >
                <span className="text-xs font-bold tracking-wider text-[#69d3c1]">{number}</span>
                <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-blue-100/75">{description}</p>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
            <p className="text-sm text-blue-100/80">
              For students, faculty, organizations, and administrators.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/student/login"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0eb89a] px-4 text-sm font-semibold text-[#062c31] transition hover:bg-[#37d1b5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#102e59]"
              >
                Student portal <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Staff workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e1e9f2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <Link href="/" aria-label="CheckedIn home" className="inline-flex items-center gap-2.5">
            <BrandMark size={32} />
            <span className="font-semibold tracking-tight text-[#17395f]">
              Checked<span className="text-[#0eb89a]">In</span>
            </span>
          </Link>
          <p className="text-xs leading-5 text-[#718196]">
            Built for better campus participation. © {new Date().getFullYear()} CheckedIn.
          </p>
        </div>
      </footer>
    </main>
  );
}
