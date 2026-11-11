# Disaster Recovery

Plans for recovering from different failure scenarios.

## Backup strategy

The project is fully contained in GitHub. There is no database and
no user data. The only persistent assets are:

1. The Git repository (GitHub).
2. The domain (Cloudflare).
3. Environment variables (Cloudflare).

## Scenario 1 - Cloudflare Pages outage

**Impact:** Site is unreachable. Users see a Cloudflare error page.

**Recovery:**

1. Wait for Cloudflare to resolve.
2. Check https://www.cloudflarestatus.com/ for status.
3. If outage is prolonged (> 1 hour), no action available - static
   hosting is entirely dependent on the host.

**Prevention:** Cloudflare has > 99.99% historical uptime.

## Scenario 2 - GitHub repository compromised

**Impact:** Attacker can push malicious code. Deployments could ship
compromised assets.

**Recovery:**

1. Immediately revoke all GitHub tokens (Settings > Developer settings).
2. Force push to `main` from a clean local clone of the last known-good
   commit.
3. Review Cloudflare deployment history for unauthorized deploys.
4. If unauthorized deploy occurred, rollback to last known-good in
   Cloudflare Pages.
5. Rotate any secrets (Cloudflare API tokens, GitHub tokens).
6. Enable 2FA on all accounts.

**Prevention:** 2FA required on GitHub and Cloudflare. Branch protection
on `main` (signed commits, CI required).

## Scenario 3 - Domain DNS hijack

**Impact:** Users are routed to an attacker-controlled site.

**Recovery:**

1. Log into Cloudflare registrar immediately.
2. Review DNS records for unauthorized changes.
3. Revert DNS records to correct values.
4. Enable registrar lock if not already on.
5. Contact Cloudflare support.

**Prevention:** Registrar lock enabled. 2FA on Cloudflare account.
Email alerts for DNS changes.

## Scenario 4 - Dependency compromise

**Impact:** A malicious npm package ships to production.

**Recovery:**

1. Identify the compromised package via `npm audit` or advisory.
2. Revert to the last known-good `package-lock.json` commit.
3. Run `npm install` to restore.
4. Rebuild and redeploy.

**Prevention:** `dependency-policy.ts` block list. `npm audit` in CI
with high/critical blocking. Package lockfile committed.

## Scenario 5 - VITE_SITE_URL misconfigured

**Impact:** Production build fails at build time (see `vite.config.ts`
guard). No deploy occurs.

**Recovery:**

1. Fix the variable in Cloudflare Pages environment settings.
2. Trigger a manual rebuild.

**Prevention:** The build-time guard prevents bad deploys. If a deploy
somehow reaches production with a wrong URL, all canonical links and
sitemap entries will be wrong, but the app still functions. Fix and
redeploy.

## Scenario 6 - Data loss on local development machine

**Impact:** Local uncommitted work lost.

**Recovery:**

1. Clone fresh from GitHub: `git clone <repo>`.
2. Install dependencies: `npm install`.
3. Re-run `npm run dev`.

**Prevention:** Commit early, push often. No local-only files matter
because everything frozen is on GitHub.

## Restore checklist

- [ ] Domain resolves to Cloudflare Pages
- [ ] Site loads with 200 on `/`
- [ ] `robots.txt` and `sitemap.xml` reachable
- [ ] `/favicon.ico` loads
- [ ] Browser console has no errors
- [ ] Analytics fires after consent
- [ ] No CSP violations

## Related documents

- `deployment-guide.md`
- `release-process.md`
- `security-policy.md`
