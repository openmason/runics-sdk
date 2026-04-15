-- API Key Middleware: tenants and api_keys tables
-- Shared across Cognium, Runics, and Cortex API surfaces.
-- Run against the shared Postgres database.

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,                    -- "tenant_abc123"
  name TEXT NOT NULL,                      -- "Acme Corp"
  type TEXT NOT NULL DEFAULT 'partner'
    CHECK (type IN ('internal', 'partner', 'enterprise')),
  contact_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'revoked')),
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  rate_limit_rpm INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,                     -- "key_xyz789"
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  key_hash TEXT NOT NULL UNIQUE,           -- SHA-256 hash of the API key
  key_prefix TEXT NOT NULL,                -- first 12 chars: "ck_live_xxxx"
  name TEXT NOT NULL,                      -- "Production key" / "CI pipeline"
  scopes TEXT[] NOT NULL,                  -- {'cognium', 'runics', 'cortex'}
  key_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (key_type IN ('standard', 'read-only', 'admin')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'rotated', 'revoked')),
  expires_at TIMESTAMPTZ,                  -- NULL = never expires
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);
