export const STUDENT_TERMS_LAST_UPDATED = "August 2026";

export type StudentTermsSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const studentTermsContent = {
  title: "Terms & Privacy Notice",
  intro:
    "By using CheckedIn, you agree to how your institution collects and uses your information for attendance and event participation. Please read this notice carefully before continuing.",
  sections: [
    {
      title: "1. Who operates this service",
      paragraphs: [
        "CheckedIn is used by your school or organization to manage event attendance. Your institution is responsible for student accounts and attendance records. CheckedIn provides the software that stores and processes this data on their behalf.",
      ],
    },
    {
      title: "2. Information we collect",
      bullets: [
        "Account details: Student ID number, full name, program, section, year level, and school email address.",
        "Credentials: A password you choose (stored securely; never stored in plain text).",
        "Student ID image: A photo of your physical ID card captured during registration or password recovery, used to verify your identity and extract ID details.",
        "Profile photo: You may upload a photo or take one with your camera during registration. This is stored as your profile avatar.",
        "Location data: GPS coordinates when you verify attendance, to confirm you are inside the event venue geofence.",
        "Camera captures: Live selfies taken during check-in to confirm your physical presence at an event.",
        "Attendance records: Event check-in and check-out times, QR tokens scanned, OTP codes entered, and verification results.",
        "Engagement data: Bingo progress, badges earned, and reward points from event participation.",
        "Device data (mobile app): Hashed login credentials and cached profile/event data stored locally so you can sign in offline after a successful online login.",
        "Notifications: In-app alerts about events, attendance, and account activity.",
      ],
    },
    {
      title: "3. How your information is used",
      bullets: [
        "Create and manage your student account.",
        "Verify your identity during registration and password reset using your student ID photo.",
        "Record and validate event attendance through QR scan, location check, OTP, and selfie verification.",
        "Prevent fraudulent check-ins (e.g., location spoofing, screenshot or replay attempts).",
        "Provide attendance history, dashboards, and reports to authorized faculty and organization staff.",
        "Award bingo badges and participation points configured by your organization.",
        "Send notifications related to events and your account.",
        "Support offline check-in on mobile devices, syncing records when internet is available.",
      ],
    },
    {
      title: "4. Who can access your data",
      paragraphs: [
        "Your data is accessible to you through the student app and portal. Authorized organization administrators, faculty, and system administrators at your institution can view attendance and profile information needed to run events and generate reports. CheckedIn does not sell your personal information.",
      ],
    },
    {
      title: "5. Third-party services",
      bullets: [
        "Cloud hosting and database (Supabase) store account, attendance, and uploaded images.",
        "OCR processing (Veryfi) reads text from your student ID photo during registration; the image is sent securely for extraction of ID number, name, and program.",
        "Your device camera and location services are used locally to capture photos and GPS coordinates required for verification.",
      ],
    },
    {
      title: "6. Data retention and security",
      paragraphs: [
        "Your information is kept for as long as your student account is active and as required by your institution's policies. Attendance and verification records may be retained for academic and audit purposes. Data is transmitted over encrypted connections and access is restricted by role-based permissions.",
      ],
    },
    {
      title: "7. Your choices and rights",
      bullets: [
        "You must accept this notice to register and use CheckedIn as a student.",
        "You can deny camera or location permissions, but registration and check-in features that require them will not work until access is granted.",
        "Contact your institution's administrator to update profile details, report issues, or ask about account deactivation and data retention.",
      ],
    },
    {
      title: "8. Acceptance",
      paragraphs: [
        'By tapping "I accept" below, you confirm that you have read and agree to this notice and consent to the collection and use of your information as described for attendance and related services at your institution.',
      ],
    },
  ] satisfies StudentTermsSection[],
};
