-- Community wall, postcards and published content.
-- Apply locally:  npm run db:migrate:local
-- Apply live:     npm run db:migrate

-- One row per mural shape. UNIQUE(region_id) makes "one shape = one painter" a database rule.
CREATE TABLE mural_claims (
  id          TEXT PRIMARY KEY,
  region_id   TEXT NOT NULL UNIQUE,
  color       TEXT NOT NULL,
  name        TEXT NOT NULL,
  place       TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  token_hash  TEXT NOT NULL,  -- sha-256 of the edit token kept in the painter's browser
  ip_hash     TEXT NOT NULL   -- salted hash, only used for rate limiting
);

CREATE TABLE splashes (
  id          TEXT PRIMARY KEY,
  x           REAL NOT NULL,
  y           REAL NOT NULL,
  seed        INTEGER NOT NULL,
  size        REAL NOT NULL,
  color       TEXT NOT NULL,
  name        TEXT NOT NULL,
  place       TEXT NOT NULL DEFAULT '',
  created_at  INTEGER NOT NULL,
  token_hash  TEXT NOT NULL,
  ip_hash     TEXT NOT NULL
);

-- Postcards visitors send to the owner. They stay 'pending' until approved in /admin;
-- only 'approved' ones appear on the public postcard rack.
CREATE TABLE postcards (
  id          TEXT PRIMARY KEY,
  message     TEXT NOT NULL,
  sender      TEXT NOT NULL,
  image       BLOB NOT NULL,
  image_type  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
  created_at  INTEGER NOT NULL,
  ip_hash     TEXT NOT NULL
);
CREATE INDEX postcards_by_status ON postcards (status, created_at DESC);

-- The published site content (same shape as public/content.json). Single row.
CREATE TABLE content (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  json        TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Recent writes per (hashed) visitor, for simple rate limiting.
CREATE TABLE write_log (
  ip_hash     TEXT NOT NULL,
  kind        TEXT NOT NULL,
  at          INTEGER NOT NULL
);
CREATE INDEX write_log_lookup ON write_log (ip_hash, kind, at);
