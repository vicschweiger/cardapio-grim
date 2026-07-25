import { MapPin, Store, Pencil } from 'lucide-react';
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
    <div className="mx-auto w-full p-5 mt-5 max-w-3xl shadow-sm rounded-lg flex items-center justify-between sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="flex items-center gap-3 overflow-hidden ">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-opacity-10"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          {isPickup ? <Store className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
        </div>
        
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {isPickup ? 'Modo de Pedido' : 'Entregar em'}
          </span>
          <span className="text-sm font-semibold text-gray-800 truncate">
            {getAddressText()}
          </span>
        </div>
      </div>

      <button 
        onClick={onEdit}
        className="shrink-0 ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        <Pencil className="w-3.5 h-3.5" />
        Alterar
      </button>
    </div>
  );
}