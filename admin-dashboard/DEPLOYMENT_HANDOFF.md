# Admin website handoff — connected existing Vercel project

**Vercel:** Existing project `totichat-admin` is connected to `jsjsnsnsnsn0-pixel/TotiChat`. Existing production domain and configuration are retained.

**New safe source:** Branch `feature/totichat-admin-staging-20261011`, folder `admin-dashboard/`, with `npm run build` -> `dist`.

**Deployment:** GitHub pushes to that branch trigger Vercel **Preview** deployments. Inspect the latest deployment in Vercel and verify it is `READY` before opening. Existing production has not been promoted or overwritten.

**Owner:** Existing Staging account `xxjjh20@gmail.com`, verified and bound to `phase3.system_authority.owner_id`; no user/password has been created, sent or changed.

**Backend:** Staging `rziaedugbdwefbefcxjt`. Banner, role, support, finance and room moderation RPCs use server-side permission checks. Room sanctions are explicitly room-only; no global user ban or month-end reset.

**Still needed for a complete release:** Owner signed-in manual E2E, Staging GitHub OAuth allowed redirect for the exact new HTTPS preview URL, actual WebP upload + visibility test, mobile browser acceptance, security review, full catalogs and payroll/agent business-rule approval.

**Production:** No deploy promotion or changes to `main`. Do not connect to Production Supabase or alter an existing Vercel domain until the Preview acceptance tests are complete.
