// src/components/ProductCard.tsx
import { Plus, Minus, Image as ImageIcon, Utensils } from 'lucide-react';
import type { Product } from '../types/index.tsx';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  primaryColor: string;
  onAdd: (product: Product) => void;
  onSubtract: (productId: string | number) => void;
}

export default function ProductCard({
  product,
  quantityInCart,
  primaryColor,
  onAdd,
  onSubtract
}: ProductCardProps) {
  
  // Formatação segura para moeda
  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-4 transition-all hover:shadow-md hover:border-gray-200">
      
      {/* 1. ESPAÇO DEDICADO PARA A IMAGEM (Sempre visível) */}
      <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex flex-col items-center justify-center relative">
        
        {product.image_url ? (
          <>
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover absolute inset-0 z-10"
              onError={(e) => {
                // Se a imagem falhar, oculta a tag img revelando o fallback abaixo
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Ícone de loading/fallback oculto sob a imagem */}
            <ImageIcon className="w-8 h-8 text-gray-300 absolute z-0" />
          </>
        ) : (
          // FALLBACK ELEGANTE (Quando não há imagem)
          <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-stone-50 to-stone-100 text-stone-300">
            <Utensils className="w-6 h-6 mb-1 opacity-50" />
          </div>
        )}

      </div>

      {/* 2. TÍTULO, DESCRIÇÃO E PREÇO */}
      <div className="flex flex-col flex-1 justify-between min-w-0">
        <div>
          <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight mb-1 truncate">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="font-bold text-gray-900 tracking-tight">
            {formatCurrency(product.price)}
          </span>
          
          {/* 3. CONTROLES DO CARRINHO */}
          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
            {quantityInCart > 0 ? (
              <>
                <button 
                  onClick={() => onSubtract(product.id)}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="w-6 sm:w-8 text-center font-bold text-sm sm:text-base text-gray-900">
                  {quantityInCart}
                </span>
                <button 
                  onClick={() => onAdd(product)}
                  className="p-1.5 sm:p-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => onAdd(product)}
                className="px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Adicionar
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}