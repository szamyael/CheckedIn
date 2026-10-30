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
} from "@/lib/icons";
import {
  IconBellRinging,
  IconBrandFlutter,
  IconBrandReact,
  IconBrandSupabase,
  IconBrandTailwind,
  IconBrandTypescript,
  IconBrandVercel,
  IconFileText,
  IconMap2,
} from "@tabler/icons-react";
import { BrandMark } from "@/components/BrandLogo";
import { ThemePanelButton } from "@/components/ThemePanelButton";
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

const poweredBy = [
  { name: "Vercel", description: "Hosts and delivers the web experience.", icon: IconBrandVercel },
  { name: "Supabase", description: "Powers accounts, database, storage, and live updates.", icon: IconBrandSupabase },
  { name: "React + Next.js", description: "Builds the fast, responsive web portal.", icon: IconBrandReact },
  { name: "TypeScript", description: "Keeps application code clear and type-safe.", icon: IconBrandTypescript },
  { name: "Flutter", description: "Powers the CheckedIn student mobile app.", icon: IconBrandFlutter },
  { name: "Veryfi", description: "Reads student ID details during registration with OCR.", icon: IconFileText },
  { name: "Leaflet + OpenStreetMap", description: "Provides interactive venue maps and location context.", icon: IconMap2 },
  { name: "OneSignal", description: "Delivers timely push notifications to students.", icon: IconBellRinging },
  { name: "Tailwind CSS", description: "Keeps the interface responsive and consistent.", icon: IconBrandTailwind },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <PhoneStudentRedirect />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <Link href="/" aria-label="CheckedIn home" className="inline-flex items-center gap-2.5">
          <BrandMark size={42} />
          <span className="text-lg font-bold tracking-tight text-[var(--primary-strong)]">
            Checked<span className="text-[var(--accent)]">In</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Portal navigation">
          <ThemePanelButton />
          <Link
            href="/student/login"
            className="hidden min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] sm:inline-flex"
          >
            Student portal
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--action-background)] px-4 text-sm font-semibold text-[var(--action-foreground)] shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            Staff sign in
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <section className="relative isolate border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="landing-hero-backdrop pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-12 lg:py-20">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[var(--primary-strong)] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" aria-hidden="true" />
              CAMPUS EVENTS, CONNECTED
            </p>
            <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.045em] text-[var(--primary-strong)] sm:text-5xl lg:text-[3.65rem]">
              Attendance that keeps{" "}
              <span className="text-[var(--accent)]">campus moving.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              Bring event check-in, clear verification, and student engagement
              together in one campus-ready platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/student/login"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--action-background)] px-5 text-sm font-semibold text-[var(--action-foreground)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              >
                Open student portal
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              >
                Explore the staff workspace
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCheck size={15} className="text-[var(--success)]" aria-hidden="true" />
                QR event check-in
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={15} className="text-[var(--success)]" aria-hidden="true" />
                Configurable verification
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="landing-visual-glow absolute -inset-4 -z-10 rounded-[2rem] blur-2xl" aria-hidden="true" />
            <div className="relative aspect-[2.4/1] overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              <Image
                src="/logos/checkedin-banner.svg"
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

      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-7xl gap-7 px-5 py-14 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14 lg:px-12 lg:py-20">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--accent)]">MADE FOR CAMPUS LIFE</p>
            <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight tracking-tight text-[var(--primary-strong)] sm:text-4xl">
              The details matter. The experience should feel simple.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">
              Give students a straightforward way to participate and staff the
              information to manage events with confidence.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 transition duration-200 hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-[var(--surface)] hover:shadow-[var(--shadow-soft)] sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] transition group-hover:bg-[var(--surface-muted)]">
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-[var(--muted)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-base font-semibold leading-6 text-[var(--primary-strong)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-10 rounded-[1.75rem] bg-[var(--action-background)] p-6 text-[var(--action-foreground)] shadow-[var(--shadow-card)] sm:p-9 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-14 lg:p-12">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[var(--action-foreground)]/80">
              <UsersRound size={15} aria-hidden="true" />
              FROM CHECK-IN TO PARTICIPATION
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              One smoother flow for the whole event.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--action-foreground)]/80">
              Keep setup simple, make check-in clear, and turn attendance into
              meaningful campus participation.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <li
                key={number}
                className="rounded-2xl border border-[color-mix(in_srgb,var(--action-foreground)_18%,transparent)] bg-[color-mix(in_srgb,var(--action-foreground)_6%,transparent)] p-4 sm:p-5"
              >
                <span className="text-xs font-bold tracking-wider text-[var(--action-foreground)]">{number}</span>
                <h3 className="mt-4 text-sm font-semibold text-[var(--action-foreground)]">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--action-foreground)]/75">{description}</p>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-3 border-t border-[color-mix(in_srgb,var(--action-foreground)_22%,transparent)] pt-6 sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
            <p className="text-sm text-[var(--action-foreground)]/80">
              For students, faculty, organizations, and administrators.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/student/login"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--background)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--action-background)]"
              >
                Student portal <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--action-foreground)_40%,transparent)] px-4 text-sm font-semibold text-[var(--action-foreground)] transition hover:bg-[color-mix(in_srgb,var(--action-foreground)_10%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-foreground)]"
              >
                Staff workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="powered-by-heading"
        className="border-y border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(15rem,.65fr)_minmax(0,1.35fr)] lg:items-center lg:gap-10 lg:px-12 lg:py-10">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--accent)]">
              BUILT WITH PURPOSE
            </p>
            <h2
              id="powered-by-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-[var(--primary-strong)] sm:text-3xl"
            >
              The tools behind CheckedIn
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Scroll through the technology powering campus check-in on web and mobile.
            </p>
          </div>
          <div
            aria-label="Technology carousel"
            className="powered-by-carousel min-w-0 overflow-x-auto overscroll-x-contain"
            role="region"
            tabIndex={0}
          >
            <div className="powered-by-track flex w-max">
              {[false, true].map((duplicate) => (
                <ul
                  key={String(duplicate)}
                  aria-hidden={duplicate || undefined}
                  className="flex w-max gap-3 pr-3"
                >
                  {poweredBy.map(({ name, description, icon: Icon }) => (
                    <li
                      key={name}
                      className="flex min-h-24 w-[17rem] items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[var(--primary-strong)]">{name}</span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{description}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <Link href="/" aria-label="CheckedIn home" className="inline-flex items-center gap-2.5">
            <BrandMark size={32} />
            <span className="font-semibold tracking-tight text-[var(--primary-strong)]">
              Checked<span className="text-[var(--accent)]">In</span>
            </span>
          </Link>
          <p className="text-xs leading-5 text-[var(--muted)]">
            Built for better campus participation. © {new Date().getFullYear()} CheckedIn.
          </p>
        </div>
      </footer>
    </main>
  );
}
