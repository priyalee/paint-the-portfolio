-- Indexes for the per-network checks on the walls and the newest-first splash list.
CREATE INDEX IF NOT EXISTS mural_claims_by_ip ON mural_claims (ip_hash);
CREATE INDEX IF NOT EXISTS splashes_by_ip ON splashes (ip_hash);
CREATE INDEX IF NOT EXISTS splashes_by_time ON splashes (created_at);
