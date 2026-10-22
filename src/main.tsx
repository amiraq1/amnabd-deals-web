import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { migrateLegacyHashLocation } from './lib/routes';
import './index.css';

// A01: a link shared before this change carried the route in the hash
// (`/#/deal/x?q=…`). It is rewritten once here, before the first render, so
// every component below only ever reads `pathname` + `search`.
const migrated = migrateLegacyHashLocation({
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
});
if (migrated) window.history.replaceState(null, '', migrated);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
