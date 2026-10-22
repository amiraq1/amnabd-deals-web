import { Component, type ReactNode } from 'react';
import type { Lang } from '@/types';

interface Props {
  children: ReactNode;
  resetKey: string;
  lang: Lang;
}
interface State {
  failed: boolean;
}

// A final containment layer, not a replacement for API validation.
export default class ContentErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(): void {
    // Intentionally omit exception details, stack, component props and data.
    console.warn('[content] rendering_failed');
  }

  componentDidUpdate(previous: Props): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey)
      this.setState({ failed: false });
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    const ar = this.props.lang === 'ar';
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6" role="alert">
        <p>
          {ar
            ? 'تعذر عرض هذا المحتوى. يمكنك العودة إلى العروض أو إعادة تحميل الصفحة.'
            : 'This content could not be displayed. Return to deals or reload the page.'}
        </p>
        {/* A full load, not a hash link: after a crash the router state cannot
            be trusted, and `/` is served as a real file. */}
        <a className="mt-4 inline-block text-emerald-400 underline" href="/">
          {ar ? 'العودة إلى العروض' : 'Return to deals'}
        </a>
        <button
          className="ms-5 text-emerald-400 underline"
          onClick={() => window.location.reload()}
        >
          {ar ? 'إعادة تحميل الصفحة' : 'Reload page'}
        </button>
      </main>
    );
  }
}
