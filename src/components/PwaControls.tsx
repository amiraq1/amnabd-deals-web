import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import type { Lang } from '@/types';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PwaControls({ lang }: { lang: Lang }) {
  const isAr = lang === 'ar';
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadAfterUpdate = useRef(false);

  useEffect(() => {
    let active = true;
    let registration: ServiceWorkerRegistration | null = null;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onControllerChange = () => {
      if (reloadAfterUpdate.current) window.location.reload();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
      return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    }

    const onUpdateFound = () => {
      const installing = registration?.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (active && installing.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(registration?.waiting ?? null);
        }
      });
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((nextRegistration) => {
        if (!active) return;
        registration = nextRegistration;
        registrationRef.current = nextRegistration;
        registration.addEventListener('updatefound', onUpdateFound);
        if (registration.waiting && navigator.serviceWorker.controller)
          setWaitingWorker(registration.waiting);
        void registration.update().catch(() => undefined);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      registration?.removeEventListener('updatefound', onUpdateFound);
      registrationRef.current = null;
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    setInstallPrompt(null);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      // The browser may dismiss or decline an install prompt without an error surface.
    }
  };

  const applyUpdate = () => {
    const worker = registrationRef.current?.waiting ?? waitingWorker;
    if (!worker) return;
    reloadAfterUpdate.current = true;
    worker.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!installPrompt && !waitingWorker) return null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-end gap-2 px-4 pt-3 sm:px-6">
      {installPrompt && (
        <button
          type="button"
          onClick={install}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {isAr ? 'تثبيت نبض' : 'Install AMNABD'}
        </button>
      )}
      {waitingWorker && (
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/20"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {isAr ? 'تحديث التطبيق' : 'Update app'}
        </button>
      )}
    </div>
  );
}
