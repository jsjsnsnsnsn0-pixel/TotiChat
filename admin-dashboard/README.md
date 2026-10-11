# TotiChat Admin Dashboard — Staging preview

## Location and safety
- This is the **same GitHub repository** currently connected to the existing Vercel `totichat-admin` project: `jsjsnsnsnsn0-pixel/TotiChat`.
- All additions are on `feature/totichat-admin-staging-20261011`. Existing `main` and the current production deployment are unchanged.
- Root for Vercel: `admin-dashboard`. Existing build `npm run build` outputs `dist`, containing only this static admin website.
- Vercel has independently created a **Preview** from the branch, distinct from Production. The preview may be protected by Vercel Authentication.
- Backend: **Supabase STAGING** `rziaedugbdwefbefcxjt` only. The source contains a browser-safe publishable key, never a service-role secret.
- Owner: `xxjjh20@gmail.com`, the existing confirmed identity bound to the primary Owner in Staging. No second Owner account was created.

## Implemented website features
- Premium RTL responsive design, original falcon assets and accessible navigation.
- Sign-in: email/password and GitHub PKCE. GitHub sign-in needs the exact deployment URL included in the Staging Auth Redirect URL allowlist.
- Owner-only financial summaries and real date/status-filtered reports, CSV export with spreadsheet formula escaping.
- Static WebP-only Banner Studio, compressed to 500 KiB: upload, schedule, edit, publish, archive, order and storage cleanup.
- Users: server-permission-checked read-only directory.
- Rooms: server-permission-checked directory and member/room-ban inspection; audited **room-only** ban/unban with reasons and confirmation for Owner/designated main partner. Global user bans remain disabled.
- Host/recharge agencies and registration requests, explicit commission approval, investigation of exceptional host transfers. No invented salary targets/rates.
- Financial discrepancy review and immutable host-diamond earning evidence, never payroll/diamond reset.
- VIP & medal Owner operations; catalog lists now cover gift catalog, gift categories, store catalog, CP types, recharge packages and recharge rewards. Only approved nonfinancial catalog activation flags are reversible here; not price/wage/reward editing.
- Real customer-support ticket list, threads, replies and statuses; Owner can assign support staff.
- Real management staff directory, restricted assignments and audit log.

## Test status
- GitHub Actions `TotiChat Admin Staging Source QA` checks JavaScript syntax, the isolated static build and source/security contracts.
- The repository also has `TotiChat admin static preview QA`. Wait for the **latest** checks to pass before relying on a new preview.
- `READY` at Vercel confirms deployed static files, not that privileged account operations passed hands-on browser E2E.

## What is still required before replacing the official site
1. In Vercel, open the latest **Preview** deployment for this branch (not production).
2. Authenticate through Vercel Preview protection if prompted.
3. Verify Owner email/password login with the existing verified account.
4. Add the exact Preview redirect to **Supabase Staging** Auth allowlist before using GitHub OAuth.
5. Test a staged WebP image and a dedicated test account for a reversible privileged operation; do not use real clients for test side effects.
6. Verify the UX on phone and desktop, then obtain the Owner's explicit approval before switching the site's production deployment.

## Known scope gaps
- Global account ban / global room shutdown and broader moderation policy need deliberate design and authorization.
- XP/levels, salary & target computations, treasury settlements and cash agent payouts are not signed off.
- Source QA is not a replacement for two-account integration, accessibility audit and production security checks.
- Do not edit `main`, change production Supabase, or promote Vercel Preview without approval.

## Local build
`cd admin-dashboard && npm run build`
This copies static dashboard assets into `dist`; no Android or consumer app build is involved.
