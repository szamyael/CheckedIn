import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/BrandLogo";
import { PhoneStudentRedirect } from "@/components/student/PhoneStudentRedirect";

const features = [
  {
    icon: QrCode,
    number: "01",
    title: "Verified attendance",
    description: "Event-specific QR codes make every check-in direct, secure, and easy to validate.",
  },
  {
    icon: MapPin,
    number: "02",
    title: "Transparent verification",
    description: "Location, OTP, and live selfie checks explain what is being verified at every step.",
  },
  {
    icon: ChartNoAxesCombined,
    number: "03",
    title: "Immediate monitoring",
    description: "Staff can follow attendance as it happens, then turn event records into clear reports.",
  },
];

const platforms = ["Next.js", "Supabase", "Vercel", "TypeScript"];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7f5] text-[#202428]">
      <PhoneStudentRedirect />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <Link href="/" aria-label="CheckedIn home" className="inline-flex items-center">
          <BrandMark size={58} />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Portal navigation">
          <Link
            href="/student/login"
            className="hidden min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-[#17324d] hover:bg-[#e7eef4] sm:inline-flex"
          >
            Student portal
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#17324d] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#0c2238]"
          >
            Staff sign in
          </Link>
        </nav>
      </header>

      <section
        className="relative min-h-[190px] border-y border-[#dce5e7] bg-cover bg-center bg-no-repeat sm:min-h-[260px] lg:min-h-[340px]"
        style={{ backgroundImage: "url('/logos/checkedin-banner.png')" }}
        aria-label="CheckedIn campus event attendance platform"
      >
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/35 to-transparent" aria-hidden="true" />
      </section>

      <section className="border-b border-[#e2e5e7] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_.92fr] lg:items-center lg:gap-16 lg:px-12 lg:py-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 border-l-2 border-[#c18a2e] pl-3 text-xs font-semibold tracking-[0.14em] text-[#697178]">CAMPUS EVENT ATTENDANCE</p>
            <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-[#0c2238] sm:text-4xl">Every campus moment, <span className="text-[#17324d]">accounted for.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#697178]">CheckedIn brings event check-in, transparent verification, participation, and reporting into one reliable campus system.</p>
          </div>
          <div className="border-l-2 border-[#17324d] pl-6 sm:pl-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#17324d]"><ShieldCheck size={19} className="text-[#237a57]" aria-hidden="true" />Built for the whole campus</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/student/login" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#17324d] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c2238]">Open student portal <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
              <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#cdd3d6] bg-white px-5 text-sm font-semibold text-[#17324d] hover:border-[#17324d] hover:bg-[#f9faf9]">Staff workspace</Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#697178]">For students, faculty, organizations, and administrators.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e2e5e7] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:px-12 lg:py-20">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-[#697178]">HOW CHECKEDIN WORKS</p>
            <h2 className="mt-4 max-w-sm text-3xl font-semibold leading-tight tracking-tight text-[#0c2238]">Simple to use. Clear to trust.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#697178]">Attendance should not stand between students and the events that matter.</p>
          </div>
          <div className="grid gap-0 border-l border-t border-[#e2e5e7] sm:grid-cols-3">
            {features.map(({ icon: Icon, number, title, description }) => (
              <article key={title} className="border-b border-r border-[#e2e5e7] p-5 sm:p-6">
                <div className="flex items-start justify-between"><Icon size={22} className="text-[#17324d]" aria-hidden="true" /><span className="text-xs font-semibold text-[#a5abb0]">{number}</span></div>
                <h3 className="mt-8 text-base font-semibold text-[#0c2238]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#697178]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-8 border border-[#d5dcde] bg-[#17324d] p-7 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#dbe6ee]"><Sparkles size={15} className="text-[#d9ad5b]" aria-hidden="true" />MEANINGFUL PARTICIPATION</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Check in, then take part.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">Attendance can unlock Bingo progress, achievements, and rewards—without taking the focus away from the event itself.</p>
          </div>
          <div className="grid grid-cols-3 border border-white/20 text-center">
            {["Attend", "Participate", "Achieve"].map((step, index) => <div key={step} className={`min-w-24 px-3 py-4 text-xs font-semibold ${index < 2 ? "border-r border-white/20" : ""}`}><Check size={17} className="mx-auto mb-2 text-[#d9ad5b]" aria-hidden="true" />{step}</div>)}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e2e5e7] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2"><BrandMark size={29} /><span className="font-semibold tracking-tight text-[#17324d]">CheckedIn</span></div>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#697178]">A campus event attendance monitoring and incentives system.</p>
            </div>
            <div className="sm:text-right"><p className="text-xs font-semibold tracking-[0.13em] text-[#697178]">CHECKEDIN IS POWERED BY</p><div className="mt-3 flex flex-wrap gap-2 sm:justify-end">{platforms.map((platform) => <span key={platform} className="inline-flex items-center gap-1.5 border border-[#d5dcde] bg-[#f6f7f5] px-3 py-1.5 text-xs font-semibold text-[#3f484f]">{platform === "Supabase" && <UsersRound size={13} aria-hidden="true" />}{platform}</span>)}</div></div>
          </div>
          <div className="mt-8 border-t border-[#e2e5e7] pt-5 text-xs text-[#697178]">© {new Date().getFullYear()} CheckedIn. Built for better campus participation.</div>
        </div>
      </footer>
    </main>
  );
}
