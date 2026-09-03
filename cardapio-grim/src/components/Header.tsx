import { Clock3, ShoppingBag } from 'lucide-react';

interface HeaderProps {
  name: string;
  coverImage?: string;
  logoUrl?: string;
  isOpen: boolean;
  minOrder?: number | string | null;
  primaryColor?: string;
}

const Header = ({ name, coverImage, logoUrl, isOpen, minOrder, primaryColor = '#0f766e' }: HeaderProps) => {
  const parsedMinOrder = typeof minOrder === 'string' ? parseFloat(minOrder) : minOrder;
  const isValidMinOrder = parsedMinOrder !== undefined
    && parsedMinOrder !== null
    && !Number.isNaN(parsedMinOrder)
    && parsedMinOrder > 0;
  const minOrderText = isValidMinOrder
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedMinOrder)
    : 'Sem mínimo';

  return (
    <header className="relative isolate overflow-hidden border-b border-stone-200/80 bg-white">
      {coverImage && (
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <img src={coverImage} alt="" className="h-full w-full object-cover opacity-[0.09] blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/75" />
        </div>
      )}
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: primaryColor }} aria-hidden="true" />

      <div className="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8">
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white p-1.5 shadow-[0_12px_35px_rgba(28,25,23,0.13)] ring-1 ring-stone-200 sm:h-24 sm:w-24">
            {logoUrl ? (
              <img src={logoUrl} alt={`Logo de ${name}`} className="h-full w-full rounded-xl object-contain" />
            ) : (
              <span className="text-3xl font-black uppercase text-stone-400 sm:text-4xl">{name?.charAt(0)}</span>
            )}
          </div>
          <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-[3px] border-white ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-400">Cardápio digital</p>
          <h1 className="truncate text-2xl font-black leading-tight tracking-tight text-stone-950 sm:text-4xl">{name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${isOpen ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {isOpen ? 'Aberto agora' : 'Fechado no momento'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600 ring-1 ring-stone-200">
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
              Pedido mínimo: {minOrderText}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
