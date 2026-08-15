import { AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';

interface MercadoPagoWalletProps {
  initPoint: string;
  environment?: 'test' | 'production';
}

export function MercadoPagoWallet({ initPoint, environment }: MercadoPagoWalletProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5 space-y-4" aria-live="polite">
      <div>
        <p className="flex items-center gap-2 font-bold text-blue-950"><ShieldCheck className="h-5 w-5" /> Pagamento preparado</p>
        <p className="mt-1 text-sm text-blue-800">O Mercado Pago abrirá em uma janela segura. Escolha uma das formas habilitadas pelo lojista e conclua o pagamento.</p>
      </div>
      {environment === 'test' && (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="status">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p><strong>Ambiente de teste:</strong> abra a loja em uma nova janela anônima e entre somente com o usuário comprador de teste do Mercado Pago.</p>
        </div>
      )}
      <a
        href={initPoint}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
      >
        Abrir Mercado Pago <ExternalLink className="h-4 w-4" />
      </a>
      <p className="text-xs text-blue-800">Após pagar, aguarde o retorno para esta página. O pedido somente será confirmado após a aprovação recebida pelo backend.</p>
    </div>
  );
}
