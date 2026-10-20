export function normalizeCampusPassToken(value: string): string | null;
export function getNewCampusPassTokens(values: unknown[], seenTokens: Set<string>): string[];
export function claimCampusPassScanToken(token: string, pendingTokens: Set<string>): boolean;
export function parseCampusPassScanResult(value: unknown):
  | {
      success: true;
      action: "checked_in" | "checked_out";
      student: {
        name: string;
        student_id: string;
        program: string;
        year_level: number | null;
        section: string | null;
      };
    }
  | { success: false; error: string }
  | null;
