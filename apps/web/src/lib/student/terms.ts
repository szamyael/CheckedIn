const TERMS_KEY = "checkedin_student_terms_accepted";

export function isStudentTermsAccepted(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(TERMS_KEY) === "1";
}

export function markStudentTermsAccepted(): void {
  window.localStorage.setItem(TERMS_KEY, "1");
  window.localStorage.setItem(
    "checkedin_student_terms_accepted_at",
    new Date().toISOString(),
  );
}
