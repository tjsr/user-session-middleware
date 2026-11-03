# Agent instructions

## npm verification and private dependencies

Follow the [shared TJSR policy][tjsr-npm-policy]. These essentials apply even when
the shared document cannot be fetched and qualify any install/test recipes below.

- Run safe local checks with existing access. If private dependencies need
  unavailable credentials, skip installation and dependent checks. After a
  401/403 authentication failure, stop retrying `npm ci` or `npm install` until
  access changes. Record an environment blocker, not a code failure.
- Do not ask for, copy, print, or provision tokens. An agent already running
  in authenticated Actions may use its configured job credentials.
  For now, assume local Codex on `tjsr-3700x` and GitHub-launched Codex agents
  lack private-package access unless explicitly configured otherwise; a GitHub
  launch alone does not establish Actions job authentication.
- Never stub private packages, invent dependency contents, use `--force` or
  `--legacy-peer-deps` to bypass resolution, disable checks, or fake success.
- Before pushing, inspect push/PR workflows and called actions for unintended
  package/image publishing, releases, or deployments. If unsafe, retain a local
  commit/patch and report the required gating change.
- When safe, commit and push authorized changes to a task/PR branch and open or
  update a draft PR. Verify through configured GitHub Actions using existing
  package grants; ordinary branches do not require Copilot delegation.
- Monitor the exact latest pushed SHA to a terminal result, inspect failed logs,
  and fix recoverable issues within scope. Report passed, failed, and unrun local
  and CI checks separately with head SHA and PR/run links. Missing workflows,
  package grants, job permissions, approvals, or Dependabot/fork secret access
  remain blockers; an older green run is insufficient.
- For new verification work, use Node 24 primarily, Node 22 where supported,
  and latest npm compatible with the declared engine floor. Check the actual
  supported matrix; this does not authorize CI/runtime/dependency changes.
- No direct-main push, approval/merge/auto-merge, release, deployment, settings
  change, or token provisioning is implied. Prior release authorization is not
  standing permission. If separately authorized to merge a repaired multi-commit
  Dependabot PR, prefer squash; a single-commit PR may use rebase.

[tjsr-npm-policy]: https://github.com/tjsr/tjsr/blob/251fd1d0606a6ce7e0c994190bbe8f318028fb9e/agent-policies/npm-ci-verification.md
