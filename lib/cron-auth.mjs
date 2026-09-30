/**
 * Decide whether the scrape endpoint may run.
 *
 * Production is fail-closed: a missing CRON_SECRET never authorizes a request.
 * Local/non-production environments may omit the secret for developer convenience.
 *
 * @param {{ authorization: string | null, secret?: string, nodeEnv?: string }} input
 */
export function isCronRequestAuthorised({ authorization, secret, nodeEnv }) {
  if (!secret) return nodeEnv !== "production";
  return authorization === `Bearer ${secret}`;
}
