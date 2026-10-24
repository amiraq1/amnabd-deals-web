import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function isStaticDealSlug(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 200 &&
    /^[a-zA-Z0-9_\-\u0600-\u06FF]+$/i.test(value)
  );
}

export function loadDealSlugSnapshot(rootDir) {
  const file = join(rootDir, 'scripts', 'public-deal-slugs.snapshot.json');
  const snapshot = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(snapshot.slugs) || !snapshot.as_of || !snapshot.source) {
    throw new Error('Public deal slug snapshot must include source, as_of, and a slugs array.');
  }
  const seen = new Set();
  for (const slug of snapshot.slugs) {
    if (!isStaticDealSlug(slug)) {
      throw new Error(`Public deal slug snapshot contains an invalid slug: ${String(slug)}`);
    }
    if (seen.has(slug)) throw new Error(`Public deal slug snapshot contains duplicate slug: ${slug}`);
    seen.add(slug);
  }
  return [...seen].sort();
}

function listDirectories(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function readText(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

function collectSitemapDealSlugs(xml, siteOrigin, violations) {
  const slugs = [];
  if (/https?:\/\/[^\s<]*#\/deal\//i.test(xml)) {
    violations.push('sitemap.xml: legacy hash-based deal URL found');
  }
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    let url;
    try {
      url = new URL(match[1]);
    } catch {
      violations.push(`sitemap.xml: invalid URL (${match[1]})`);
      continue;
    }
    if (!url.pathname.startsWith('/deal/')) continue;
    if (url.origin !== siteOrigin || url.search || url.hash) {
      violations.push(`sitemap.xml: deal route must be canonical and same-origin (${match[1]})`);
      continue;
    }
    const route = url.pathname.match(/^\/deal\/([^/]+)$/);
    if (!route) {
      violations.push(`sitemap.xml: invalid deal route (${match[1]})`);
      continue;
    }
    try {
      slugs.push(decodeURIComponent(route[1]));
    } catch {
      violations.push(`sitemap.xml: invalid deal slug (${match[1]})`);
    }
  }
  return slugs;
}

function collectLlmsDealSlugs(text, siteOrigin, violations) {
  const slugs = [];
  if (/https?:\/\/[^\s)\]]*#\/deal\//i.test(text)) {
    violations.push('llms.txt: legacy hash-based deal URL found');
  }
  for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    let url;
    try {
      url = new URL(match[1]);
    } catch {
      violations.push(`llms.txt: invalid link (${match[1]})`);
      continue;
    }
    if (!url.pathname.startsWith('/deal/')) continue;
    if (url.origin !== siteOrigin || url.search || url.hash) {
      violations.push(`llms.txt: deal route must be canonical and same-origin (${match[1]})`);
      continue;
    }
    const route = url.pathname.match(/^\/deal\/([^/]+)$/);
    if (!route) {
      violations.push(`llms.txt: invalid deal route (${match[1]})`);
      continue;
    }
    try {
      slugs.push(decodeURIComponent(route[1]));
    } catch {
      violations.push(`llms.txt: invalid deal slug (${match[1]})`);
    }
  }
  return slugs;
}

function checkExactSlugIndex(label, found, expected, violations) {
  const foundSet = new Set();
  for (const slug of found) {
    if (foundSet.has(slug)) violations.push(`${label}: duplicate deal slug ${slug}`);
    foundSet.add(slug);
    if (!expected.has(slug)) violations.push(`${label}: unreviewed or unknown SEO slug ${slug}`);
  }
  for (const slug of expected) {
    if (!foundSet.has(slug)) violations.push(`${label}: reviewed SEO slug missing ${slug}`);
  }
}

/**
 * Check the generated route tree against the live (or reviewed snapshot) public
 * slug set. The source catalog is the reviewed SEO index: live-only records get
 * an exact generic app shell and are deliberately excluded from SEO claims.
 */
export function verifySeoParity({
  distDir,
  catalogDeals,
  liveDealSlugs,
  baseHtml,
  baseUrl,
}) {
  const violations = [];
  const catalog = new Set();
  for (const deal of catalogDeals) {
    const slug = deal?.slug;
    if (!isStaticDealSlug(slug)) {
      violations.push(`SEO catalog contains invalid deal slug: ${String(slug)}`);
      continue;
    }
    if (catalog.has(slug)) violations.push(`SEO catalog contains duplicate deal slug: ${slug}`);
    catalog.add(slug);
  }

  const live = new Set();
  for (const slug of liveDealSlugs) {
    if (!isStaticDealSlug(slug)) {
      violations.push(`Public deal list contains invalid slug: ${String(slug)}`);
      continue;
    }
    if (live.has(slug)) violations.push(`Public deal list contains duplicate slug: ${slug}`);
    live.add(slug);
  }

  for (const slug of catalog) {
    if (!live.has(slug)) violations.push(`SEO catalog slug is not present in the current public deals: ${slug}`);
  }

  const expectedRoutes = new Set([...catalog, ...live]);
  const routeDir = join(distDir, 'deal');
  const actualRoutes = new Set(listDirectories(routeDir));
  for (const slug of expectedRoutes) {
    if (!actualRoutes.has(slug)) violations.push(`deal/${slug}: required public route artifact is missing`);
  }
  for (const slug of actualRoutes) {
    if (!expectedRoutes.has(slug)) violations.push(`deal/${slug}: route artifact has no current public deal`);
  }

  const cleanBase = String(baseUrl).replace(/\/+$/, '');
  let siteOrigin;
  try {
    siteOrigin = new URL(cleanBase).origin;
  } catch {
    violations.push(`Invalid site URL for SEO parity: ${cleanBase}`);
    siteOrigin = '';
  }

  for (const slug of expectedRoutes) {
    const html = readText(join(routeDir, slug, 'index.html'));
    if (html === null) {
      violations.push(`deal/${slug}: route index document is missing`);
      continue;
    }
    if (catalog.has(slug)) {
      if (html === baseHtml) {
        violations.push(`deal/${slug}: reviewed SEO route was replaced by a generic shell`);
      }
      const canonical = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i.exec(html)?.[1];
      const expectedCanonical = `${cleanBase}/deal/${slug}`;
      if (canonical !== expectedCanonical) {
        violations.push(`deal/${slug}: canonical route mismatch (expected ${expectedCanonical})`);
      }
      if (readText(join(distDir, 'og', `${slug}.svg`)) === null) {
        violations.push(`og/${slug}.svg: reviewed SEO artifact is missing`);
      }
    } else {
      if (html !== baseHtml) {
        violations.push(`deal/${slug}: live-only route must remain the exact generic app shell`);
      }
      if (existsSync(join(distDir, 'og', `${slug}.svg`))) {
        violations.push(`og/${slug}.svg: live-only route must not publish a generated SEO card`);
      }
    }
  }

  const ogDir = join(distDir, 'og');
  if (existsSync(ogDir)) {
    for (const file of readdirSync(ogDir).filter((name) => name.endsWith('.svg'))) {
      const slug = file.slice(0, -4);
      if (!catalog.has(slug)) violations.push(`og/${file}: SEO card is outside the reviewed catalog`);
    }
  }

  const sitemap = readText(join(distDir, 'sitemap.xml'));
  if (sitemap === null) {
    violations.push('sitemap.xml: generated artifact is missing');
  } else {
    checkExactSlugIndex(
      'sitemap.xml',
      collectSitemapDealSlugs(sitemap, siteOrigin, violations),
      catalog,
      violations
    );
  }

  const llms = readText(join(distDir, 'llms.txt'));
  if (llms === null) {
    violations.push('llms.txt: generated artifact is missing');
  } else {
    checkExactSlugIndex(
      'llms.txt',
      collectLlmsDealSlugs(llms, siteOrigin, violations),
      catalog,
      violations
    );
  }

  return violations;
}
