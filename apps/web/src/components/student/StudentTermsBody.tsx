import {
  STUDENT_TERMS_LAST_UPDATED,
  studentTermsContent,
} from "@/lib/student/terms-content";

export function StudentTermsBody({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <h1 className="text-xl font-bold text-[var(--primary-strong)]">
        {studentTermsContent.title}
      </h1>
      <p className="mt-2 text-sm text-[var(--foreground)]">{studentTermsContent.intro}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Last updated: {STUDENT_TERMS_LAST_UPDATED}
      </p>

      <div className="mt-6 space-y-5">
        {studentTermsContent.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-bold text-[var(--primary-strong)]">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm text-[var(--foreground)]">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[var(--foreground)]">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
