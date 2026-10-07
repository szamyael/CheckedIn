/*
| CheckedIn — 059_multiple_active_bingo_cards.sql
| Organizations may publish more than one active bingo card.
| Students choose which published card to view.
*/

BEGIN;

DROP INDEX IF EXISTS bingo_cards_one_active_per_org;

COMMENT ON COLUMN public.bingo_cards.status IS
'Bingo card lifecycle: draft (org-only), active (students can select and earn), archived (read-only history). Multiple cards per organization may be active at once.';

COMMIT;
