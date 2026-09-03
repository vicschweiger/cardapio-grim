import { MapPin, Store, Pencil } from 'lucide-react';
import { PiBaseballHelmetBold } from 'react-icons/pi';
import type { Theme } from '../types/index.tsx';

interface DeliveryStatusBarProps {
  isPickup: boolean;
  deliveryFee: number;
  customerAddressInfo: any;
  onEdit: () => void;
  theme?: Theme;
}

export function DeliveryStatusBar({ isPickup, deliveryFee, customerAddressInfo, onEdit, theme }: DeliveryStatusBarProps) {
  const primaryColor = theme?.primary || '#0d9488'; // teal-600 default

  // Formata o valor do frete para Real (BRL)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Função inteligente para extrair o endereço seja qual for o formato que a API / Banco retornar
  const getAddressText = () => {
    if (isPickup) return 'Retirada na Loja (Balcão)';
    if (!customerAddressInfo) return 'Endereço não informado';

    // 1. Tenta pegar Rua e Número (Formato Ideal)
    if (customerAddressInfo.street && customerAddressInfo.street.trim() !== '') {
      return `${customerAddressInfo.street}, ${customerAddressInfo.number || 'S/N'}`;
    }
    
    // 2. Tenta pegar a string completa montada pelo modal (Fallback 1)
    if (customerAddressInfo.full && customerAddressInfo.full.trim() !== '') {
      return customerAddressInfo.full;
    }

    // 3. Se por acidente o objeto inteiro for só uma string (Fallback 2)
    if (typeof customerAddressInfo === 'string') {
      return customerAddressInfo;
    }

    return 'Endereço selecionado';
  };

  return (
    <section aria-label="Entrega do pedido" className="relative z-20 mx-auto mt-5 flex w-[calc(100%-2rem)] max-w-4xl items-center justify-between rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-[0_10px_30px_rgba(28,25,23,0.08)] backdrop-blur-xl sm:w-[calc(100%-3rem)] sm:p-4">
      <div className="flex items-center gap-3 overflow-hidden">
        <div 
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          {isPickup ? <Store className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
        </div>
        
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
            {isPickup ? 'Modo de Pedido' : 'Entregar em'}
          </span>

          <span className="text-xs sm:text-sm font-bold text-gray-800 truncate">
            {getAddressText()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 ml-3">
        {/* Bloco de Frete com Capacete de Corrida e Frame Verde */}
        {!isPickup && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 shadow-2xs">
            <PiBaseballHelmetBold  className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex flex-col text-right items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 leading-none">Frete</span>
              <span className="text-xs font-extrabold leading-tight">
                {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}
              </span>
            </div>
          </div>
        )}

        <button 
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-4 focus:ring-stone-200"
        >
          <Pencil className="w-3.5 h-3.5 text-gray-500" />
          Alterar
        </button>
      </div>
    </section>
  );
}
