# Vercel auto-deploy (GitHub → production)

The web app lives in `apps/web` and the Vercel project **checkedin** is configured with:

- **Root Directory:** `apps/web`
- **Framework:** Next.js
- **Production URL:** https://checkedin-gamma.vercel.app (alias may vary by project)

## Preferred: native Git integration (no Actions secrets)

1. Open [Vercel Login Connections](https://vercel.com/account/login-connections) and connect **GitHub**.
2. Open [Project → Settings → Git](https://vercel.com/szamyael634s-projects/checkedin/settings/git) and connect repo `szamyael/CheckedIn`.
3. Ensure production branch is `main`.
4. Every push to `main` deploys automatically.

Or from `apps/web` after step 1:

```bash
vercel git connect https://github.com/szamyael/CheckedIn.git --yes
```

## Fallback: GitHub Actions

Workflow: `.github/workflows/deploy-web.yml`

Add these repository secrets (Settings → Secrets → Actions):

| Secret | Value |
|--------|--------|
| `VERCEL_TOKEN` | Create at https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `team_GLdR4h24qfkACHLTek6OktKH` |
| `VERCEL_PROJECT_ID` | `prj_a7ZO5POUjAe8U3YvNxi8QbwjyFro` |
