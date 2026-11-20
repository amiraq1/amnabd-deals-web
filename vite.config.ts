import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { publicSupabaseConfig } from './src/lib/environment';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (command === 'build') {
    const config = publicSupabaseConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
    if (!config.ok)
      throw new Error(`Public Supabase build configuration rejected: ${config.reason}`);
  }
  return {
    base: '/',
    plugins: [
      react(),
      {
        name: 'html-transform-perf',
        transformIndexHtml(html) {
          const tags = [];
          if (env.VITE_SUPABASE_URL) {
            try {
              const parsed = new URL(env.VITE_SUPABASE_URL);
              if (parsed.protocol === 'https:') {
                tags.push(
                  {
                    tag: 'link',
                    attrs: { rel: 'preconnect', href: parsed.origin, crossorigin: '' },
                    injectTo: 'head-prepend',
                  },
                  {
                    tag: 'link',
                    attrs: { rel: 'dns-prefetch', href: parsed.origin },
                    injectTo: 'head-prepend',
                  }
                );
              }
            } catch {
              /* ignore invalid URL during build */
            }
          }
          return { html, tags };
        },
      },
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    optimizeDeps: { exclude: ['lucide-react'] },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase') || id.includes('postgrest')) {
                return 'vendor-supabase';
              }
            }
          },
        },
      },
    },
  };
});

