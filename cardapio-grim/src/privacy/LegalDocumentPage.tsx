import { ArrowLeft, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatLegalDate, useLegalDocuments, type LegalDocumentType } from './LegalDocumentsContext.tsx';
import { PrivacyFooter } from './PrivacyFooter.tsx';

const names: Record<LegalDocumentType, string> = { terms: 'Termos', privacy: 'Política de Privacidade' };

export function LegalDocumentPage({ type }: { type: LegalDocumentType }) {
  const { getDocument, loading, error, reload } = useLegalDocuments();
  const document = getDocument(type);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-teal-100"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar</Link>
        {loading && <section aria-live="polite" aria-busy="true" className="mt-6 flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" aria-hidden="true" /><p className="mt-3 font-semibold">Carregando {names[type]}...</p></div></section>}
        {!loading && error && <section role="alert" className="mt-6 rounded-2xl border border-red-200 bg-white p-6 text-center"><h1 className="text-xl font-black">Não foi possível abrir o documento</h1><p className="mt-2 text-sm text-red-700">{error}</p><button type="button" onClick={() => void reload()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-200"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar novamente</button></section>}
        {!loading && document && <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="bg-slate-900 px-6 py-7 text-white sm:px-9"><FileText className="h-7 w-7 text-teal-300" aria-hidden="true" /><h1 className="mt-4 text-2xl font-black sm:text-3xl">{document.title}</h1><p className="mt-3 text-sm text-slate-300">Versão {document.version} · Publicado em {formatLegalDate(document.published_at)}</p></header><div className="whitespace-pre-wrap break-words px-6 py-7 text-[15px] leading-7 text-slate-700 sm:px-9 sm:py-10">{document.body}</div></article>}
      </main>
      <PrivacyFooter />
    </div>
  );
}
