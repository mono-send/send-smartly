-- MonoSend initial database schema and seed data
-- PostgreSQL dialect

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE email_status AS ENUM ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'pending');
CREATE TYPE email_event_type AS ENUM ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed');
CREATE TYPE contact_status AS ENUM ('subscribed', 'unsubscribed', 'bounced', 'complained');
CREATE TYPE api_key_permission AS ENUM ('full', 'sending', 'read');
CREATE TYPE domain_status AS ENUM ('pending', 'verified', 'failed');
CREATE TYPE broadcast_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
CREATE TYPE topic_default_behavior AS ENUM ('opt_in', 'opt_out');
CREATE TYPE topic_visibility AS ENUM ('public', 'private');
CREATE TYPE topic_subscription_status AS ENUM ('subscribed', 'unsubscribed');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Domains
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL UNIQUE,
  status domain_status NOT NULL DEFAULT 'pending',
  region TEXT NOT NULL,
  tracking_subdomain TEXT,
  dkim_status TEXT,
  spf_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  token_preview TEXT,
  permission api_key_permission NOT NULL DEFAULT 'full',
  domain_scope UUID REFERENCES domains(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  markup TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Emails
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  status email_status NOT NULL DEFAULT 'queued',
  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_created_at ON emails(created_at DESC);

-- Immutable email events (no updated_at/updated_by)
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  event_type email_event_type NOT NULL,
  provider_message_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_email_events_email ON email_events(email_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);

-- Audience contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  status contact_status NOT NULL DEFAULT 'subscribed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE contact_property_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  property_key TEXT NOT NULL,
  data_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (owner_id, property_key)
);

CREATE TABLE contact_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  property_definition_id UUID NOT NULL REFERENCES contact_property_definitions(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (contact_id, property_definition_id)
);

CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (owner_id, name)
);

CREATE TABLE contact_segments (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (contact_id, segment_id)
);

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_behavior topic_default_behavior NOT NULL DEFAULT 'opt_in',
  visibility topic_visibility NOT NULL DEFAULT 'public',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (owner_id, name)
);

CREATE TABLE contact_topics (
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subscription_status topic_subscription_status NOT NULL DEFAULT 'subscribed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (contact_id, topic_id)
);

-- Broadcasts
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status broadcast_status NOT NULL DEFAULT 'draft',
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  subject TEXT,
  from_email TEXT,
  scheduled_for TIMESTAMPTZ,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Immutable API request logs
CREATE TABLE api_request_logs (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  http_method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_logs_endpoint ON api_request_logs(endpoint);
CREATE INDEX idx_logs_status ON api_request_logs(status_code);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Immutable webhook deliveries
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  response_ms INTEGER,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);

-- Usage snapshots (immutable metrics per day)
CREATE TABLE usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  contacts_count INTEGER NOT NULL DEFAULT 0,
  broadcasts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (owner_id, snapshot_date)
);

-- Seed data
INSERT INTO users (id, email, full_name, role, plan, created_by, updated_by)
VALUES ('11111111-1111-1111-1111-111111111111', 'user@example.com', 'MonoSend User', 'owner', 'free', NULL, NULL);

INSERT INTO domains (id, owner_id, domain_name, status, region, tracking_subdomain, created_by, updated_by) VALUES
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'mail.monosend.co', 'verified', 'us-east-1', 'links.monosend.co', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'notify.example.com', 'verified', 'us-east-1', 'clicks.example.com', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'updates.startup.io', 'pending', 'eu-west-1', 'updates.startup.io', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO api_keys (id, owner_id, name, token_hash, token_preview, permission, is_active, last_used_at, created_by, updated_by) VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Production', crypt('ms_live_prod_secret', gen_salt('bf')), 'ms_live_••••••••••••••••', 'full', TRUE, NOW() - INTERVAL '2 minutes', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Development', crypt('ms_test_dev_secret', gen_salt('bf')), 'ms_test_••••••••••••••••', 'sending', TRUE, NOW() - INTERVAL '1 hour', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Analytics', crypt('ms_live_analytics_secret', gen_salt('bf')), 'ms_live_••••••••••••••••', 'read', TRUE, NULL, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO templates (id, owner_id, name, subject, description, markup, created_by, updated_by)
VALUES ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Welcome', 'Welcome to MonoSend', 'Template used for onboarding', '<p>Welcome to MonoSend!</p>', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO contacts (id, owner_id, email, status, created_by, updated_by) VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'john@example.com', 'subscribed', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 'sarah@startup.io', 'subscribed', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', 'dev@company.com', 'unsubscribed', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555554', '11111111-1111-1111-1111-111111111111', 'marketing@brand.co', 'subscribed', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO contact_property_definitions (id, owner_id, name, property_key, data_type, description, created_by, updated_by) VALUES
  ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', 'Segment', 'segment', 'text', 'Assigned marketing segment', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO contact_properties (contact_id, property_definition_id, value, created_by, updated_by) VALUES
  ('55555555-5555-5555-5555-555555555551', '66666666-6666-6666-6666-666666666661', '"General"'::jsonb, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555552', '66666666-6666-6666-6666-666666666661', '"VIP"'::jsonb, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555553', '66666666-6666-6666-6666-666666666661', '"General"'::jsonb, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555554', '66666666-6666-6666-6666-666666666661', '"Newsletter"'::jsonb, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO segments (id, owner_id, name, description, is_default, created_by, updated_by) VALUES
  ('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', 'General', 'System default segment', TRUE, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', 'VIP', 'High value customers', FALSE, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('77777777-7777-7777-7777-777777777773', '11111111-1111-1111-1111-111111111111', 'Newsletter', 'Monthly newsletter audience', FALSE, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO contact_segments (contact_id, segment_id, created_by, updated_by) VALUES
  ('55555555-5555-5555-5555-555555555551', '77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555552', '77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555553', '77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555554', '77777777-7777-7777-7777-777777777773', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO topics (id, owner_id, name, default_behavior, visibility, created_by, updated_by) VALUES
  ('88888888-8888-8888-8888-888888888881', '11111111-1111-1111-1111-111111111111', 'Product Updates', 'opt_in', 'public', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('88888888-8888-8888-8888-888888888882', '11111111-1111-1111-1111-111111111111', 'Marketing', 'opt_out', 'public', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO contact_topics (contact_id, topic_id, subscription_status, created_by, updated_by) VALUES
  ('55555555-5555-5555-5555-555555555551', '88888888-8888-8888-8888-888888888881', 'subscribed', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555552', '88888888-8888-8888-8888-888888888881', 'subscribed', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555553', '88888888-8888-8888-8888-888888888881', 'subscribed', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555554', '88888888-8888-8888-8888-888888888882', 'subscribed', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO emails (id, owner_id, domain_id, api_key_id, template_id, to_email, from_email, subject, status, sent_at, delivered_at, opened_at, clicked_at, bounced_at, created_by, updated_by)
VALUES
  ('99999999-9999-9999-9999-999999999991', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444444', 'john@example.com', 'hello@mail.monosend.co', 'Welcome to MonoSend', 'delivered', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '1 minute', NULL, NULL, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999992', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333332', NULL, 'sarah@startup.io', 'billing@notify.example.com', 'Your invoice is ready', 'opened', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '10 minutes', NULL, NULL, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999993', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331', NULL, 'dev@company.com', 'support@mail.monosend.co', 'Password reset request', 'sent', NOW() - INTERVAL '1 hour', NULL, NULL, NULL, NULL, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999994', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333333', NULL, 'marketing@brand.co', 'news@updates.startup.io', 'Weekly newsletter', 'clicked', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '80 minutes', NULL, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999995', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333332', NULL, 'invalid@bounce.test', 'auth@mail.monosend.co', 'Account verification', 'bounced', NOW() - INTERVAL '3 hours', NULL, NULL, NULL, NOW() - INTERVAL '3 hours', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999996', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333331', NULL, 'queue@example.com', 'reports@mail.monosend.co', 'Scheduled report', 'queued', NULL, NULL, NULL, NULL, NULL, '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

INSERT INTO email_events (email_id, event_type, provider_message_id, occurred_at, payload, created_by) VALUES
  ('99999999-9999-9999-9999-999999999991', 'delivered', 'msg-101', NOW() - INTERVAL '2 minutes', jsonb_build_object('region', 'us-east-1'), '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999992', 'opened', 'msg-102', NOW() - INTERVAL '10 minutes', jsonb_build_object('client', 'Gmail'), '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999993', 'sent', 'msg-103', NOW() - INTERVAL '1 hour', jsonb_build_object('provider', 'ses'), '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999994', 'clicked', 'msg-104', NOW() - INTERVAL '80 minutes', jsonb_build_object('link', 'https://monosend.co'), '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999995', 'bounced', 'msg-105', NOW() - INTERVAL '3 hours', jsonb_build_object('reason', 'invalid mailbox'), '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999996', 'queued', 'msg-106', NOW() - INTERVAL '5 hours', jsonb_build_object('batch', true), '11111111-1111-1111-1111-111111111111');

INSERT INTO api_request_logs (owner_id, api_key_id, endpoint, http_method, status_code, user_agent, created_by)
VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '/emails', 'POST', 200, 'resend-node:6.4.0', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '/emails', 'POST', 200, 'resend-node:6.4.0', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', '/domains', 'GET', 200, 'curl/8.1.2', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '/emails/batch', 'POST', 429, 'resend-python:1.2.0', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', '/emails', 'POST', 400, 'axios/1.6.0', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '/api-keys', 'GET', 200, 'resend-node:6.4.0', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '/emails', 'POST', 500, 'resend-go:1.0.0', '11111111-1111-1111-1111-111111111111');

INSERT INTO usage_snapshots (owner_id, snapshot_date, emails_sent, contacts_count, broadcasts_count, created_by)
VALUES ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 6, 4, 0, '11111111-1111-1111-1111-111111111111');

COMMIT;
