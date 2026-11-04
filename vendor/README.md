# express-mysql-session declaration dependency patch

The original MIT-licensed `@types/express-mysql-session` 3.0.8 declarations and
license are unchanged. Its package metadata is patched only to require mysql2
3.10.2, matching express-mysql-session 3.0.3's runtime dependency, instead of
introducing mysql2 3.9.8 into downstream production installs. Library-local npm
overrides do not protect consumers. No declaration package release is available
with the corrected driver dependency.

The expanded source is retained in `express-mysql-session-types/`; the matching
archive is the installed dependency. The main package references an immutable
commit URL, and its lockfile records archive integrity. This is a local metadata
fork, not an unchanged registry artifact. Keeping the original declaration text,
package name and version preserves TypeScript package identity, including the
MySQL store class's private member. TypeScript 6 and 7 cross-assignment checks
with the registry provider pass without skipLibCheck or casts.

Upstream archive:
https://registry.npmjs.org/@types/express-mysql-session/-/express-mysql-session-3.0.8.tgz

Upstream integrity:
`sha512-ljtWFQZHQDIzr/FfQYa/twmdm871uJOMJz7a6hPRBaeBpw49pCBxUYfb56N3troI8i8uHsKjYJ1lpZhSlYl25w==`

Rebuild the archive from the reviewed expanded source with lifecycle scripts
disabled: `npm pack ./vendor/express-mysql-session-types --ignore-scripts`.
Do not substitute the registry archive or change the source declarations without
rechecking type identity and isolated production dependency resolution.
