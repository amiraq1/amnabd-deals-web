# amnabd-deals-web

منصة **أم ن عبد** للعروض التوفيرية — موقع ثنائي اللغة (عربي / إنجليزي) يعرض العروض من Supabase.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + lucide-react
- Supabase (data + auth-ready)

## Scripts

```bash
npm run dev        # dev server
npm run typecheck  # TS strict check (app + node configs)
npm run lint       # eslint
npm run build      # production build
```

## Env

`.env` (ignored) needs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
