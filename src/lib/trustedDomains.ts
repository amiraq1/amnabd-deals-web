// Reviewed allowlist of provider domains that may appear as a deal's official
// source or offer link. It is intentionally static: a compromised database row
// cannot point visitors at a new domain without a reviewed code change.
//
// Provenance: derived from the 144 official-source/offer hosts of the 118 live
// deals on 2026-11-10, then reduced to registrable domains. Re-derive and review
// this list whenever a deal introduces a new provider domain.
//
// Multi-tenant or free-subdomain services are listed as exact hosts instead of
// registrable domains, so unrelated user content on the same service is not
// trusted (for example devpost.com is deliberately absent).
const TRUSTED_EXACT_HOSTS = new Set([
  'forms.gle',
  'kiroween.devpost.com',
  'nic.eu.org',
]);

const TRUSTED_DOMAINS = new Set([
  'aboutamazon.com',
  'aiven.io',
  'akash.network',
  'alibabacloud.com',
  'amazon.com',
  'amd.com',
  'anthropic.com',
  'antigravity.google',
  'antseed.com',
  'apple.com',
  'assemblyai.com',
  'backblaze.com',
  'blitz.cloud',
  'blog.google',
  'bolt.new',
  'bynara.id',
  'cartesia.ai',
  'certavert.com',
  'claude.com',
  'cloady.com',
  'cloudflare.com',
  'coderabbit.ai',
  'cohere.com',
  'cometapi.com',
  'context.dev',
  'cto.new',
  'daytona.io',
  'deepgram.com',
  'deepseek.com',
  'digitalocean.com',
  'docker.com',
  'docspring.com',
  'dphn.ai',
  'e2b.dev',
  'exa.ai',
  'fal.ai',
  'figma.com',
  'fish.audio',
  'fly.io',
  'free.ai',
  'freebuff.com',
  'freestyle.sh',
  'geekflare.com',
  'generalcompute.com',
  'github.blog',
  'github.com',
  'google.com',
  'google.dev',
  'groq.com',
  'hetzner.com',
  'heygen.com',
  'huggingface.co',
  'hyperbrowser.ai',
  'ideavo.ai',
  'inceptionlabs.ai',
  'inferall.ai',
  'inference.net',
  'iteracompute.com',
  'jetbrains.com',
  'jina.ai',
  'kaggle.com',
  'kiro.dev',
  'krafton.ai',
  'layerbase.com',
  'lightning.ai',
  'llm7.io',
  'marsai.click',
  'microsoft.com',
  'mindshub.ai',
  'mistral.ai',
  'mixedbread.com',
  'mixroute.ai',
  'modal.com',
  'mongodb.com',
  'nebius.com',
  'nexconn.ai',
  'notion.com',
  'novita.ai',
  'openai.com',
  'opencode.ai',
  'openrouter.ai',
  'oracle.com',
  'orcarouter.ai',
  'pingwise.com',
  'posthog.com',
  'prized.dev',
  'reka.ai',
  'requesty.ai',
  'rtrvr.ai',
  'runloop.ai',
  'runwayml.com',
  'sbintuitions.co.jp',
  'serpkite.com',
  'speechmatics.com',
  'steel.dev',
  'stepfun.ai',
  'tavily.com',
  'tensorlake.ai',
  'thesmartoken.com',
  'tinyfish.ai',
  'tokenrouter.com',
  'valyu.ai',
  'vercel.com',
  'viktor.com',
  'yepapi.com',
  'you.com',
  'z.ai',
  'zed.dev',
  'zenmux.ai',
]);

/**
 * True when the hostname is a reviewed provider domain or one of its
 * subdomains. Parent labels are walked so a subdomain like
 * `docs.github.com` is accepted only because `github.com` is listed.
 */
export function isTrustedExternalHost(hostname: string): boolean {
  let host = hostname.toLowerCase().replace(/\.$/, '');
  while (host) {
    if (TRUSTED_EXACT_HOSTS.has(host) || TRUSTED_DOMAINS.has(host)) return true;
    const separator = host.indexOf('.');
    if (separator === -1) return false;
    host = host.slice(separator + 1);
  }
  return false;
}
