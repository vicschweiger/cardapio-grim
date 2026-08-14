import { ExternalLink, ShieldCheck } from 'lucide-react';

interface MercadoPagoWalletProps {
  initPoint: string;
}

export function MercadoPagoWallet({ initPoint }: MercadoPagoWalletProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5 space-y-4" aria-live="polite">
      <div>
        <p className="flex items-center gap-2 font-bold text-blue-950"><ShieldCheck className="h-5 w-5" /> Pagamento preparado</p>
        <p className="mt-1 text-sm text-blue-800">O Mercado Pago abrirá em uma janela segura. Escolha uma das formas habilitadas pelo lojista e conclua o pagamento.</p>
      </div>
      <a
        href={initPoint}
        target="grimdev_mercadopago"
        rel="noopener noreferrer"
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
      >
        Abrir Mercado Pago <ExternalLink className="h-4 w-4" />
      </a>
      <p className="text-xs text-blue-800">Após pagar, aguarde o retorno para esta página. O pedido somente será confirmado após a aprovação recebida pelo backend.</p>
    </div>
  );
}
