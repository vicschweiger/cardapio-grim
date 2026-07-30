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
    <div className="mx-auto w-full p-4 sm:p-5 mt-5 max-w-3xl shadow-sm rounded-xl flex items-center justify-between sticky top-0 z-20 bg-white/95 backdrop-blur-sm border border-gray-100">
      <div className="flex items-center gap-3 overflow-hidden">
        <div 
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 bg-opacity-10"
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
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-2xs"
        >
          <Pencil className="w-3.5 h-3.5 text-gray-500" />
          Alterar
        </button>
      </div>
    </div>
  );
}