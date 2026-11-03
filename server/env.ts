/** Bindings and secrets available to the /api functions (see wrangler.toml). */
export interface Env {
  DB: D1Database;
  /** Password for /admin. Admin routes are disabled until it is set. */
  ADMIN_KEY?: string;
  /** Salt for hashing visitor IPs (rate limiting only). */
  IP_SALT?: string;
  /** Optional: Resend API key, to get an email when a postcard arrives. */
  RESEND_API_KEY?: string;
  /** Optional: the address those emails go to. */
  NOTIFY_EMAIL?: string;
}
