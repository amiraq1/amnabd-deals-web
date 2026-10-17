/*
# Create AMNABD Deals tables

This migration creates three tables for the AMNABD Deals website — a bilingual
(Arabic/English) site that lists 10 AI tool offers with rich structured data.

1. New Tables

- `deals` — stores the 10 AI tool deals with all structured fields:
  - `id` (text, primary key) — short identifier like "qwen"
  - `slug` (text, unique) — URL slug like "qwen-cloud"
  - `name_ar` / `name_en` (text) — bilingual tool names
  - `description_ar` / `description_en` (text) — bilingual descriptions
  - `category` (jsonb) — {value, legacy_value, review_status}
  - `benefits` (jsonb) — array of benefit objects
  - `eligibility` (jsonb) — eligibility details
  - `pricing` (jsonb) — pricing info
  - `registration` (jsonb) — registration deadline & credit validity
  - `official_sources` (jsonb) — array of official source objects with evidence
  - `get_offer` (jsonb) — {url, type, label}
  - `review` (jsonb) — verification status, offer status, dates, notes
  - `created_at` (timestamptz)

- `usage_guides` — stores usage guide content per deal:
  - `id` (uuid, primary key)
  - `slug` (text, unique) — matches deal slug
  - `sections` (jsonb) — {eligibility, registration, limitations, after_expiry} each with ar/en text and sources
  - `created_at` (timestamptz)

- `site_config` — stores site-wide configuration:
  - `id` (text, primary key) — singleton "main"
  - `overview` (jsonb) — bilingual overview text
  - `section_labels` (jsonb) — bilingual section label mappings
  - `last_reviewed` (date) — last reviewed date

2. Security

- Enable RLS on all three tables.
- This is a no-auth public website: all policies use `TO anon, authenticated`.
- SELECT is public (anyone can browse deals and guides).
- No INSERT/UPDATE/DELETE policies — data is managed via migrations only.

3. Important Notes

- The `get_offer` field's original intermediary URL (studentoffers.co) is replaced
  with the first official source URL for each deal during data insertion, so the
  "Get Offer" button links directly to the official source.
*/

CREATE TABLE IF NOT EXISTS deals (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text NOT NULL,
  description_en text NOT NULL,
  category jsonb NOT NULL DEFAULT '{}'::jsonb,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  eligibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  registration jsonb NOT NULL DEFAULT '{}'::jsonb,
  official_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  get_offer jsonb NOT NULL DEFAULT '{}'::jsonb,
  review jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_deals" ON deals;
CREATE POLICY "public_select_deals" ON deals FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS usage_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE usage_guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_usage_guides" ON usage_guides;
CREATE POLICY "public_select_usage_guides" ON usage_guides FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS site_config (
  id text PRIMARY KEY DEFAULT 'main',
  overview jsonb NOT NULL DEFAULT '{}'::jsonb,
  section_labels jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_reviewed date
);

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_site_config" ON site_config;
CREATE POLICY "public_select_site_config" ON site_config FOR SELECT
  TO anon, authenticated USING (true);
