import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportCatalogError } from '../services/errorReporting.ts';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportCatalogError({ action: 'react_render', message: error.message, reason: error.name, stack: `${error.stack || ''}\n${info.componentStack || ''}` });
  }
  render() {
    if (this.state.failed) return <main className="grid min-h-screen place-items-center bg-stone-50 p-6 text-center"><div><h1 className="text-xl font-black text-stone-900">Não foi possível abrir o cardápio</h1><p className="mt-2 text-stone-600">Atualize a página para tentar novamente.</p></div></main>;
    return this.props.children;
  }
}
