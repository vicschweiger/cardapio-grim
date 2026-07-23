import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export function CheckoutEmptyState({ companySlug }: { companySlug: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-center">
      <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-900">O seu carrinho está vazio</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">Adicione itens do menu antes de tentar finalizar a sua compra.</p>
      <Link to={`/${companySlug}`} className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700">
        <ArrowLeft className="w-4 h-4" /> Voltar para o Cardápio
      </Link>
    </div>
  );
}