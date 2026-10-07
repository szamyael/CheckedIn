# CheckedIn Architecture

```mermaid
flowchart LR
    Admin[Admin] --> Web
    Faculty[Faculty] --> Web
    Org[Organization member] --> Web
    Student[Student] --> Mobile
    Student --> StudentWeb[Student browser pages]

    subgraph Clients
        Web[Next.js web app]
        Mobile[Flutter mobile app]
        StudentWeb
    end

    subgraph Supabase
        Auth[Supabase Auth]
        DB[(PostgreSQL)]
        RLS[Row Level Security]
        Storage[Private Storage\nstudent IDs and selfies]
        Realtime[Realtime]
        Edge[Edge Functions]
    end

    Web --> Auth
    Web --> DB
    Web --> Storage
    Web --> Realtime
    Mobile --> Auth
    Mobile --> DB
    Mobile --> Storage
    Mobile --> Edge
    StudentWeb --> Auth
    StudentWeb --> DB
    DB --- RLS
    RLS -. protects .-> DB
    Edge --> DB
    Edge --> Storage
    Edge --> Veryfi[Veryfi OCR API]
    Realtime --> Web
    Realtime --> Mobile

    Mobile -. offline attendance queue\nsyncs when online .-> Edge

    subgraph SharedPackages
        Constants[shared_constants]
        Models[shared_models]
        Validation[shared_validation]
    end
    Constants -. shared definitions .-> Web
    Constants -. shared definitions .-> Mobile
    Models -. shared definitions .-> Web
    Models -. shared definitions .-> Mobile
    Validation -. shared rules .-> Web
    Validation -. shared rules .-> Mobile
```

## Main responsibilities

- **Web app:** dashboards and management tools for administrators, faculty, and organization members.
- **Mobile app:** student registration, event discovery, QR check-in, GPS and selfie capture, attendance history, and offline attendance capture.
- **Supabase:** authentication, PostgreSQL data, row-level authorization, private file storage, realtime updates, and trusted Edge Function workflows.
- **Edge Functions:** server-side check-in and offline attendance submission, ID scanning and registration, student login/reset helpers, and staff QR/OTP operations.
- **Veryfi:** OCR provider called by the student ID scanning Edge Function.
- **Shared packages:** common constants, models, and validation used across the applications.
