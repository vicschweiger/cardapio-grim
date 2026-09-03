import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api').replace(/\/$/, '');

export type LegalDocumentType = 'terms' | 'privacy';

export interface LegalDocument {
  id: number;
  document_type: LegalDocumentType;
  version: string;
  title: string;
  body: string;
  content_sha256: string;
  published_at: string;
}

interface LegalDocumentsContextValue {
  documents: LegalDocument[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  getDocument: (type: LegalDocumentType) => LegalDocument | null;
}

const LegalDocumentsContext = createContext<LegalDocumentsContextValue | null>(null);

export function LegalDocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/legal/documents/`);
      const data = await response.json().catch(() => ({})) as { documents?: LegalDocument[]; detail?: string };
      if (!response.ok) throw new Error(data.detail || 'Não foi possível carregar os documentos jurídicos.');
      const current = data.documents ?? [];
      if (!current.some(document => document.document_type === 'terms') || !current.some(document => document.document_type === 'privacy')) {
        throw new Error('Os documentos jurídicos vigentes não estão disponíveis.');
      }
      setDocuments(current);
    } catch (loadError) {
      setDocuments([]);
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os documentos jurídicos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const value = useMemo<LegalDocumentsContextValue>(() => ({
    documents,
    loading,
    error,
    reload,
    getDocument: type => documents.find(document => document.document_type === type) ?? null,
  }), [documents, error, loading, reload]);

  return <LegalDocumentsContext.Provider value={value}>{children}</LegalDocumentsContext.Provider>;
}

export function useLegalDocuments() {
  const context = useContext(LegalDocumentsContext);
  if (!context) throw new Error('useLegalDocuments deve ser usado dentro de LegalDocumentsProvider.');
  return context;
}

export const formatLegalDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(parsed);
};
