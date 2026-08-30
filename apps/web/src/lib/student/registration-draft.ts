const DRAFT_KEY = "checkedin.studentRegistrationDraft";

export type RegistrationDraft = {
  studentId: string;
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  program: string;
  section: string;
  yearLevel: number;
  imageBase64: string;
  avatarBase64: string;
  avatarFromId: boolean;
};

export const emptyRegistrationDraft = (): RegistrationDraft => ({
  studentId: "",
  email: "",
  firstName: "",
  middleName: "",
  lastName: "",
  nameExtension: "",
  program: "",
  section: "",
  yearLevel: 1,
  imageBase64: "",
  avatarBase64: "",
  avatarFromId: false,
});

export function loadRegistrationDraft(): RegistrationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RegistrationDraft>;
    if (!parsed.studentId || !parsed.imageBase64) return null;
    return { ...emptyRegistrationDraft(), ...parsed, avatarFromId: Boolean(parsed.avatarFromId) };
  } catch {
    return null;
  }
}

export function saveRegistrationDraft(draft: RegistrationDraft, step: 1 | 2 | 3) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...draft,
        step,
      }),
    );
  } catch {
    // Ignore quota errors; registration can still continue in-memory.
  }
}

export function loadRegistrationStep(): 1 | 2 | 3 {
  if (typeof window === "undefined") return 1;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return 1;
    const step = Number((JSON.parse(raw) as { step?: number }).step);
    return step === 2 || step === 3 ? step : 1;
  } catch {
    return 1;
  }
}

export function clearRegistrationDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
}

export async function readFunctionError(
  error: { message: string; context?: Response },
  data: unknown,
): Promise<string> {
  if (data && typeof data === "object" && "error" in data) {
    const message = String((data as { error?: string }).error ?? "").trim();
    if (message) return message;
  }

  if (error.context) {
    try {
      const body = (await error.context.json()) as { error?: string };
      if (body?.error) return body.error;
    } catch {
      // Fall through to generic message.
    }
  }

  return error.message || "Request failed";
}
