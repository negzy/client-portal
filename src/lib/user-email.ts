/**
 * Canonical form for `User.email` (and lead emails at rest): trim + lowercase.
 * Always use this before create/update and for the primary login lookup so
 * casing and stray spaces cannot strand accounts.
 */
export function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase();
}
