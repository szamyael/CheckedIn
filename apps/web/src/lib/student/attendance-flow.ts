export type AttendanceFlowState = {
  qrToken: string;
  latitude?: number;
  longitude?: number;
  requiresOtp?: boolean;
  otpCode?: string;
  eventId?: string;
  eventTitle?: string;
  locationVerified?: boolean;
};

const FLOW_KEY = "checkedin_attendance_flow";

export function saveFlow(state: AttendanceFlowState) {
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(state));
}

export function loadFlow(): AttendanceFlowState | null {
  try {
    const raw = sessionStorage.getItem(FLOW_KEY);
    return raw ? (JSON.parse(raw) as AttendanceFlowState) : null;
  } catch {
    return null;
  }
}

export function clearFlow() {
  sessionStorage.removeItem(FLOW_KEY);
}
