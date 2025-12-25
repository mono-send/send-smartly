-- MonoSend demo schema
-- Defines core tables surfaced by the React pages along with seed data aligned to UI mocks.
-- All timestamps use TIMESTAMPTZ to remain timezone-safe.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SET TIME ZONE 'UTC';

-- Enum definitions -----------------------------------------------------------
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE contact_status AS ENUM ('subscribed', 'unsubscribed', 'bounced', 'complained');
CREATE TYPE email_status AS ENUM ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');
CREATE TYPE broadcast_status AS ENUM ('draft', 'scheduled', 'sending', 'completed', 'failed', 'paused');
CREATE TYPE domain_status AS ENUM ('verified', 'pending', 'suspended');
CREATE TYPE dns_record_type AS ENUM ('TXT', 'MX', 'CNAME', 'A', 'AAAA');
CREATE TYPE dns_record_status AS ENUM ('verified', 'pending', 'not_started');
CREATE TYPE http_method AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');
CREATE TYPE log_source AS ENUM ('api', 'mcp');
CREATE TYPE webhook_status AS ENUM ('active', 'disabled');
CREATE TYPE webhook_delivery_status AS ENUM ('pending', 'success', 'failed', 'retrying');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'email');
CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE metric_granularity AS ENUM ('hour', 'day');
CREATE TYPE api_key_permission AS ENUM ('full_access', 'sending_access', 'read_only');

-- Core tables ---------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  status contact_status NOT NULL DEFAULT 'subscribed',
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_contacts_status ON contacts (status);

CREATE TABLE contact_segments (
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (contact_id, segment_id)
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL UNIQUE,
  status domain_status NOT NULL DEFAULT 'pending',
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_domains_status ON domains (status);
CREATE INDEX idx_domains_region ON domains (region);

CREATE TABLE dns_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  record_type dns_record_type NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  ttl TEXT NOT NULL DEFAULT 'auto',
  priority TEXT,
  status dns_record_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_dns_records_domain ON dns_records (domain_id);
CREATE INDEX idx_dns_records_status ON dns_records (status);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  permission api_key_permission NOT NULL DEFAULT 'full_access',
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_api_keys_last_used ON api_keys (last_used_at DESC);

CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  status broadcast_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_broadcasts_status ON broadcasts (status);
CREATE INDEX idx_broadcasts_scheduled ON broadcasts (scheduled_at);

CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'queued',
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_emails_to_email ON emails (to_email);
CREATE INDEX idx_emails_status ON emails (status);
CREATE INDEX idx_emails_domain ON emails (domain_id);
CREATE INDEX idx_emails_sent_at ON emails (sent_at DESC);

CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  method http_method NOT NULL,
  source log_source NOT NULL,
  user_agent TEXT,
  request_body JSONB DEFAULT '{}'::jsonb,
  response_body JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_logs_endpoint ON logs (endpoint);
CREATE INDEX idx_logs_status_code ON logs (status_code);
CREATE INDEX idx_logs_source ON logs (source);
CREATE INDEX idx_logs_created_at ON logs (created_at DESC);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  secret TEXT,
  status webhook_status NOT NULL DEFAULT 'active',
  event_types TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  status webhook_delivery_status NOT NULL DEFAULT 'pending',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries (status);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries (webhook_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  details TEXT,
  action_url TEXT,
  action_label TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_notifications_user ON notifications (user_id);
CREATE INDEX idx_notifications_type ON notifications (type);
CREATE INDEX idx_notifications_read ON notifications (read);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  webhook_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  digest_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_file TEXT,
  status import_status NOT NULL DEFAULT 'pending',
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_imports_status ON imports (status);

CREATE TABLE metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  granularity metric_granularity NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  bounced_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_metrics_snapshots_window ON metrics_snapshots (window_start, window_end);
CREATE INDEX idx_metrics_snapshots_domain ON metrics_snapshots (domain_id);

CREATE TABLE metrics_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  range_start TIMESTAMPTZ NOT NULL,
  range_end TIMESTAMPTZ NOT NULL,
  granularity metric_granularity NOT NULL,
  sent_total INTEGER NOT NULL DEFAULT 0,
  delivered_total INTEGER NOT NULL DEFAULT 0,
  opened_total INTEGER NOT NULL DEFAULT 0,
  clicked_total INTEGER NOT NULL DEFAULT 0,
  bounced_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_metrics_aggregates_range ON metrics_aggregates (range_start, range_end);

-- Seed data -----------------------------------------------------------------
-- Users (seeded first so created_by references resolve)
INSERT INTO users (id, email, name, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@monosend.io', 'MonoSend Admin', 'owner'),
  ('00000000-0000-0000-0000-000000000002', 'john@example.com', 'John Doe', 'editor'),
  ('00000000-0000-0000-0000-000000000003', 'sarah@startup.io', 'Sarah Startup', 'editor'),
  ('00000000-0000-0000-0000-000000000004', 'dev@company.com', 'Dev Company', 'viewer'),
  ('00000000-0000-0000-0000-000000000005', 'marketing@brand.co', 'Marketing Brand', 'viewer')
ON CONFLICT (id) DO NOTHING;

-- Segments
INSERT INTO segments (id, name, description, created_by)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'General', 'System default audience', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'VIP', 'High-value subscribers', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'Newsletter', 'Weekly newsletter audience', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Contacts
INSERT INTO contacts (id, email, status, created_by)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'john@example.com', 'subscribed', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'sarah@startup.io', 'subscribed', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'dev@company.com', 'unsubscribed', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'marketing@brand.co', 'subscribed', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Contact <-> Segment links
INSERT INTO contact_segments (contact_id, segment_id, created_by) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Templates that back the sample emails/broadcasts
INSERT INTO templates (id, name, slug, subject, html, text, created_by) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Welcome Email', 'welcome_email', 'Welcome to MonoSend', '<h1>Hello {{name}}</h1><p>Welcome to MonoSend!</p>', 'Hello {{name}}, welcome to MonoSend!', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', 'Invoice Ready', 'invoice_ready', 'Your invoice is ready', '<p>Your invoice {{invoice_id}} is ready.</p>', 'Your invoice is ready.', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', 'Weekly Newsletter', 'weekly_newsletter', 'This Week in Tech', '<p>Latest news and updates</p>', 'Latest news and updates', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Domains
INSERT INTO domains (id, domain, status, region, created_by) VALUES
  ('40000000-0000-0000-0000-000000000001', 'mail.monosend.co', 'verified', 'us-east-1', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'notify.example.com', 'verified', 'us-east-1', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 'updates.startup.io', 'pending', 'eu-west-1', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000004', 'mail.monosend.io', 'verified', 'us-east-1', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- DNS records reflecting the Domain Details page
INSERT INTO dns_records (domain_id, record_type, name, content, ttl, priority, status, created_by) VALUES
  ('40000000-0000-0000-0000-000000000001', 'TXT', 'resend._domainkey', 'p=MIGfMA0GCSqGSIb3DQEB...', 'Auto', NULL, 'verified', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', 'MX', 'send', 'feedback-smtp.us-east-1...', '60', '10', 'verified', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', 'TXT', 'send', 'v=spf1 include:amazonses...', '60', NULL, 'verified', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', 'MX', '@', 'inbound-smtp.us-east-1...', '60', '9', 'not_started', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'TXT', 'resend._domainkey', 'p=MIGfMA0GCSqGSIb3DQEB...', 'Auto', NULL, 'verified', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'MX', 'send', 'feedback-smtp.us-east-1...', '60', '10', 'verified', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'TXT', 'send', 'v=spf1 include:amazonses...', '60', NULL, 'verified', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', 'MX', '@', 'inbound-smtp.us-east-1...', '60', '9', 'verified', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 'TXT', 'resend._domainkey', 'p=MIGfMA0GCSqGSIb3DQEB...', 'Auto', NULL, 'pending', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 'MX', 'send', 'feedback-smtp.eu-west-1...', '60', '10', 'pending', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 'TXT', 'send', 'v=spf1 include:amazonses...', '60', NULL, 'pending', '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003', 'MX', '@', 'inbound-smtp.eu-west-1...', '60', '9', 'not_started', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- API keys (masked tokens mirror the UI)
INSERT INTO api_keys (id, name, token, permission, domain_id, last_used_at, created_by)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'Production', 'ms_live_B5Bbt6Y6...', 'full_access', NULL, NOW() - INTERVAL '2 minutes', '00000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000002', 'Development', 'ms_test_K8Jht9P2...', 'sending_access', NULL, NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000000003'),
  ('50000000-0000-0000-0000-000000000003', 'Analytics', 'ms_live_M3Nqw7R4...', 'read_only', NULL, NULL, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Broadcasts
INSERT INTO broadcasts (id, name, subject, segment_id, template_id, status, scheduled_at, created_by)
VALUES
  ('60000000-0000-0000-0000-000000000001', 'Weekly Newsletter', 'This Week in Tech', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'completed', NOW() - INTERVAL '3 hours', '00000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000002', 'Welcome Series', 'Welcome to MonoSend', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'scheduled', NOW() + INTERVAL '1 day', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Emails displayed on the Emails page
INSERT INTO emails (id, contact_id, to_email, from_email, subject, status, template_id, domain_id, broadcast_id, sent_at, created_by)
VALUES
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'john@example.com', 'welcome@monosend.io', 'Welcome to MonoSend', 'delivered', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '2 minutes', '00000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'sarah@startup.io', 'billing@monosend.io', 'Your invoice is ready', 'opened', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '15 minutes', '00000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'dev@company.com', 'security@monosend.io', 'Password reset request', 'sent', NULL, '40000000-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'marketing@brand.co', 'newsletter@monosend.io', 'Weekly newsletter', 'clicked', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours', '00000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000005', NULL, 'invalid@bounce.test', 'verify@monosend.io', 'Account verification', 'bounced', NULL, '40000000-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '3 hours', '00000000-0000-0000-0000-000000000001'),
  ('70000000-0000-0000-0000-000000000006', NULL, 'queue@example.com', 'reports@monosend.io', 'Scheduled report', 'queued', NULL, '40000000-0000-0000-0000-000000000001', NULL, NOW() - INTERVAL '5 hours', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Logs (API + MCP events)
INSERT INTO logs (id, endpoint, status_code, method, source, user_agent, request_body, response_body, created_at, created_by) VALUES
  ('80000000-0000-0000-0000-000000000001', '/emails', 200, 'POST', 'api', 'resend-node:6.4.0', '{"to":["user@example.com"],"subject":"Welcome to MonoSend"}', '{"id":"3fcd4164-be76-4555-9bb4-9f155f8cbedf"}', NOW() - INTERVAL '2 minutes', '00000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000002', '/tools/send_email', 200, 'POST', 'mcp', 'mcp-client:1.0.0', '{"to":"user@example.com","template_id":"order_shipped"}', '{"success":true,"email_id":"em_8f7d6c5b4a3e2f1d"}', NOW() - INTERVAL '3 minutes', '00000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000003', '/emails', 200, 'POST', 'api', 'resend-node:6.4.0', '{"to":["customer@example.com"],"subject":"Order Confirmation"}', '{"id":"a1b2c3d4-e5f6-7890-abcd-ef1234567890"}', NOW() - INTERVAL '5 minutes', '00000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000004', '/tools/list_contacts', 200, 'GET', 'mcp', 'mcp-client:1.0.0', '{"audience_id":"aud_newsletter","limit":50,"offset":0}', '{"success":true,"total":1247}', NOW() - INTERVAL '10 minutes', '00000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000005', '/domains', 200, 'GET', 'api', 'curl/8.1.2', '{}', '{"data":[{"id":"1","name":"monosend.io","status":"verified"}]}', NOW() - INTERVAL '15 minutes', '00000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000006', '/tools/create_broadcast', 429, 'POST', 'mcp', 'mcp-client:1.0.0', '{"name":"Weekly Newsletter","schedule_at":"2024-12-26T09:00:00Z"}', '{"error":{"code":"rate_limit_exceeded","retry_after":60}}', NOW() - INTERVAL '30 minutes', '00000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000007', '/emails/batch', 429, 'POST', 'api', 'resend-python:1.2.0', '{"emails":[{"to":"a@example.com"},{"to":"b@example.com"}]}', '{"message":"Rate limit exceeded"}', NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000008', '/tools/get_metrics', 500, 'GET', 'mcp', 'mcp-client:1.0.0', '{"metrics":["sent","delivered","opened","clicked","bounced"]}', '{"error":{"code":"internal_error"}}', NOW() - INTERVAL '2 hours', '00000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000009', '/emails', 400, 'POST', 'api', 'axios/1.6.0', '{"subject":"Test"}', '{"message":"Missing required field: from"}', NOW() - INTERVAL '2 hours', '00000000-0000-0000-0000-000000000001'),
  ('80000000-0000-0000-0000-000000000010', '/api-keys', 200, 'GET', 'api', 'resend-node:6.4.0', '{}', '{"data":[{"id":"key_1","name":"Production"}]}', NOW() - INTERVAL '3 hours', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Webhooks and deliveries for completeness
INSERT INTO webhooks (id, name, target_url, secret, status, event_types, created_by)
VALUES
  ('90000000-0000-0000-0000-000000000001', 'Email Events', 'https://example.com/webhooks/email', 'whsec_123', 'active', ARRAY['email.delivered','email.opened','email.clicked'], '00000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-0000-000000000002', 'MCP Activity', 'https://example.com/webhooks/mcp', 'whsec_456', 'active', ARRAY['mcp.request'], '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO webhook_deliveries (webhook_id, payload, response_status, response_body, status, attempt_number, created_at, created_by)
VALUES
  ('90000000-0000-0000-0000-000000000001', '{"event":"email.delivered","email_id":"70000000-0000-0000-0000-000000000001"}', 200, '{"received":true}', 'success', 1, NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-0000-000000000001', '{"event":"email.bounced","email_id":"70000000-0000-0000-0000-000000000005"}', 500, '{"error":"Temporary failure"}', 'retrying', 2, NOW() - INTERVAL '30 minutes', '00000000-0000-0000-0000-000000000001'),
  ('90000000-0000-0000-0000-000000000002', '{"event":"mcp.request","tool":"send_email"}', 200, '{"received":true}', 'success', 1, NOW() - INTERVAL '3 hours', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Notifications + preferences (matches Notifications page)
INSERT INTO notifications (id, user_id, type, title, description, details, action_url, action_label, read, created_at, created_by) VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'email', 'Email delivered successfully', 'Your email to user@example.com was delivered.', 'Transactional email delivered at 09:45 AM. Delivery time: 1.2 seconds.', '/emails/1', 'View Email', FALSE, NOW() - INTERVAL '2 minutes', '00000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'warning', 'Rate limit warning', 'You are approaching your daily email limit (80% used).', '8,000 of 10,000 daily quota consumed. Estimated exhaustion in ~2 hours.', '/settings', 'Upgrade Plan', FALSE, NOW() - INTERVAL '15 minutes', '00000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'success', 'Domain verified', 'monosend.io has been successfully verified.', 'DKIM, SPF, and DMARC records configured.', '/domains/1', 'View Domain', FALSE, NOW() - INTERVAL '1 hour', '00000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'info', 'New feature available', 'MCP integration is now available for your account.', 'AI assistants can now call MonoSend tools; monitor usage in logs.', '/logs', 'View Logs', TRUE, NOW() - INTERVAL '2 hours', '00000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'email', 'Broadcast completed', 'Weekly Newsletter was sent to 1,247 recipients.', 'Delivery stats: 1,241 delivered, 4 bounced, 2 pending.', '/broadcasts', 'View Broadcast', TRUE, NOW() - INTERVAL '3 hours', '00000000-0000-0000-0000-000000000001'),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'warning', 'Bounce rate increase', 'Bounce rate increased by 5% in the last 24 hours.', 'From 2.1% to 7.1%; review audience quality.', '/metrics', 'View Metrics', TRUE, NOW() - INTERVAL '5 hours', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification_preferences (user_id, email_enabled, webhook_enabled, digest_frequency, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000002', TRUE, TRUE, 'daily', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;

-- Imports (from Import Contacts flow)
INSERT INTO imports (id, source_file, status, total_rows, processed_rows, segment_id, started_at, completed_at, created_by)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'uploads/audience_import.csv', 'completed', 250, 250, '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', '00000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'uploads/vip_import.csv', 'processing', 100, 42, '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '2 hours', NULL, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Metrics snapshots/aggregates (used by logs + metrics tools)
INSERT INTO metrics_snapshots (domain_id, segment_id, window_start, window_end, granularity, sent_count, delivered_count, opened_count, clicked_count, bounced_count, created_by)
VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 day', NOW(), 'hour', 1500, 1480, 820, 340, 8, '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day', NOW(), 'hour', 400, 395, 210, 75, 3, '00000000-0000-0000-0000-000000000001');

INSERT INTO metrics_aggregates (domain_id, segment_id, range_start, range_end, granularity, sent_total, delivered_total, opened_total, clicked_total, bounced_total, created_by)
VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '7 days', NOW(), 'day', 9000, 8800, 5100, 2100, 40, '00000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days', NOW(), 'day', 1200, 1185, 640, 230, 6, '00000000-0000-0000-0000-000000000001');

-- Notes:
-- * Mutable tables include created_at/created_by/updated_at/updated_by/deleted_at/deleted_by.
-- * Event-style tables (logs, webhook_deliveries, metrics) omit updated_at/updated_by but keep soft-delete columns.
-- * Use deleted_at filters in queries to exclude soft-deleted rows.
