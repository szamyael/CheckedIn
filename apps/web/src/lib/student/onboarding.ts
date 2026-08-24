const ONBOARDING_KEY = "checkedin_student_onboarding_complete";

export function isStudentOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markStudentOnboardingComplete(): void {
  window.localStorage.setItem(ONBOARDING_KEY, "1");
}
