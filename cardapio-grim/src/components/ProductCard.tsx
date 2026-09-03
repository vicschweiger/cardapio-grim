import { Image as ImageIcon, Minus, Plus, Utensils } from 'lucide-react';
import type { Product } from '../types/index.tsx';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  primaryColor: string;
  onAdd: (product: Product) => void;
  onSubtract: (productId: string | number) => void;
}

const formatCurrency = (value: number | string | null | undefined) => {
  const parsed = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isNaN(parsed) ? 0 : parsed);
};

export default function ProductCard({ product, quantityInCart, primaryColor, onAdd, onSubtract }: ProductCardProps) {
  const isPromotional = Boolean(product.is_promotional && product.original_price);

  return (
    <article className="group relative flex min-h-36 gap-3 overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-3 shadow-[0_5px_20px_rgba(28,25,23,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_14px_34px_rgba(28,25,23,0.10)] sm:gap-4 sm:p-4">
      {isPromotional && (
        <span className="absolute left-2 top-2 z-20 rounded-lg bg-rose-600 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">Promoção</span>
      )}

      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-100 bg-stone-50 sm:h-32 sm:w-32">
        {product.image_url ? (
          <>
            <ImageIcon className="absolute h-8 w-8 text-stone-300" aria-hidden="true" />
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              onError={event => { (event.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 text-stone-300">
            <Utensils className="h-7 w-7" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-stone-900 sm:text-base">{product.name}</h3>
          {product.description && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-stone-500 sm:text-[13px]">{product.description}</p>}
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {isPromotional && <span className="block text-[10px] font-semibold text-stone-400 line-through">{formatCurrency(product.original_price)}</span>}
            <span className={`block font-black tracking-tight ${isPromotional ? 'text-base text-rose-600' : 'text-[15px] text-stone-900'}`}>{formatCurrency(product.price)}</span>
          </div>

          {quantityInCart > 0 ? (
            <div className="flex shrink-0 items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5 shadow-inner">
              <button type="button" onClick={() => onSubtract(product.id)} aria-label={`Remover uma unidade de ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-white hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-stone-300"><Minus className="h-4 w-4" aria-hidden="true" /></button>
              <span className="w-6 text-center text-sm font-black text-stone-900" aria-live="polite">{quantityInCart}</span>
              <button type="button" onClick={() => onAdd(product)} aria-label={`Adicionar mais uma unidade de ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-700 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"><Plus className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => onAdd(product)} aria-label={`Adicionar ${product.name} ao pedido`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-all hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-black/10" style={{ backgroundColor: primaryColor }}><Plus className="h-5 w-5" aria-hidden="true" /></button>
          )}
        </div>
      </div>
    </article>
  );
}
