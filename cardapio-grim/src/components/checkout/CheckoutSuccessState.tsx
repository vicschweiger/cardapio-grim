import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

interface CheckoutSuccessStateProps {
  orderId: number;
  companySlug: string;
}

export function CheckoutSuccessState({ orderId, companySlug }: CheckoutSuccessStateProps) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex p-3 rounded-full bg-green-50 text-green-500">
          <CheckCircle2 className="w-16 h-16 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Pedido Recebido!</h2>
          <p className="text-sm text-gray-500">O seu pedido já foi enviado diretamente para a nossa cozinha e está sendo preparado.</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm font-semibold text-gray-700">
          Senha do Pedido: <span className="text-teal-600 font-mono text-base">#{orderId.toString().slice(-6)}</span>
        </div>
        <button 
          onClick={() => navigate(`/${companySlug}`)}
          className="w-full bg-teal-600 text-white rounded-xl py-3 font-bold hover:bg-teal-700 shadow-md shadow-teal-600/10 transition-colors"
        >
          Voltar ao Cardápio
        </button>
      </div>
    </div>
  );
}