import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface CheckoutHeaderProps {
  companySlug: string;
  logoUrl?: string;
  companyName: string;
  catalogName?: string;
}

export function CheckoutHeader({ companySlug, logoUrl, companyName, catalogName }: CheckoutHeaderProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
        <Link to={`/${companySlug}`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="shrink-0 relative">
          {logoUrl ? (
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white flex items-center justify-center overflow-hidden p-1.5 shadow-sm border border-gray-100">
              <img src={logoUrl} alt={`Logo de ${companyName}`} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200 shadow-sm">
              <span className="text-gray-400 text-3xl sm:text-4xl font-bold uppercase">
                {companyName ? companyName.charAt(0) : ''}
              </span>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-bold text-gray-900">Finalizar Pedido</h2>
          <p className="text-xs text-gray-500 capitalize">{catalogName}</p>
        </div>
      </div>
    </nav>
  );
}