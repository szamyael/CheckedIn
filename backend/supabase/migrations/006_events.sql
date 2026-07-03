/*
|--------------------------------------------------------------------------
| CheckedIn — 006_events.sql
|--------------------------------------------------------------------------
*/

BEGIN;

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    description TEXT,

    venue_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_radius_m INTEGER NOT NULL DEFAULT 100
        CHECK (location_radius_m > 0 AND location_radius_m <= 5000),

    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,

    status public.event_status NOT NULL DEFAULT 'draft',

    qr_token UUID NOT NULL DEFAULT gen_random_uuid(),
    qr_expires_at TIMESTAMPTZ,

    created_by UUID NOT NULL
        REFERENCES public.users(id)
        ON DELETE RESTRICT,

    organization_id UUID
        REFERENCES public.organizations(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT events_time_range CHECK (ends_at > starts_at)
);

COMMENT ON TABLE public.events IS
'Calendar events with geofenced attendance and unique QR tokens.';

COMMENT ON COLUMN public.events.qr_token IS
'Embedded in QR codes scanned by students for check-in.';

CREATE INDEX idx_events_starts_at ON public.events (starts_at);
CREATE INDEX idx_events_status ON public.events (status);
CREATE INDEX idx_events_created_by ON public.events (created_by);
CREATE INDEX idx_events_qr_token ON public.events (qr_token);

COMMIT;
