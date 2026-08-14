interface HeaderProps {
  name: string;
  coverImage?: string; 
  logoUrl?: string;    
  isOpen: boolean;
  minOrder?: number | string | null;
}

const Header = ({ name, logoUrl, isOpen, minOrder }: HeaderProps) => {
  const parsedMinOrder = typeof minOrder === 'string' ? parseFloat(minOrder) : minOrder;
  
  const isValidMinOrder = 
    parsedMinOrder !== undefined && 
    parsedMinOrder !== null && 
    !isNaN(parsedMinOrder) && 
    parsedMinOrder > 0;

  const minOrderText = isValidMinOrder
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedMinOrder)
    : 'Não definido';

  return (
    <header className="bg-white w-full border-b border-gray-100 shadow-sm relative z-10">
      {/* Container flexível com justify-between para espalhar os itens */}
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-6 sm:px-6">
        
        {/* BLOCO ESQUERDO: Avatar + Informações */}
        <div className="flex items-center gap-4">
          {/* AVATAR / LOGO */}
          <div className="shrink-0 relative">
            {logoUrl ? (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden p-1.5">
                <img
                  src={logoUrl}
                  alt={`Logo de ${name}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200 shadow-sm">
                <span className="text-gray-400 text-3xl sm:text-4xl font-bold uppercase">
                  {name ? name.charAt(0) : ''}
                </span>
              </div>
            )}
          </div>

          {/* NOME E STATUS */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-2 capitalize">
              {name}
            </h1>

            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3 items-center justify-center">
                {isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isOpen ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
              </div>
              
              <span
                className={`text-sm font-semibold tracking-wide ${
                  isOpen ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {isOpen ? 'Aberto agora' : 'Fechado no momento'}
              </span>
            </div>
          </div>
        </div>

        {/* BLOCO DIREITO: Pedido Mínimo justificado à direita */}
        <div className="hidden sm:flex flex-col items-end text-right ml-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Pedido mínimo
          </span>
          <span className="text-xs font-bold tracking-wider text-gray-500">
            {minOrderText}
          </span>
        </div>

      </div>

      {/* MOBILE: Pedido Mínimo exibido embaixo para não espremer o título em telas pequenas */}
      <div className="sm:hidden gap-2 w-full border-t border-gray-50 bg-gray-50/50 px-4 py-2.5 flex justify-start items-center text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Pedido mínimo
        </span>
        <span className="text-xs font-bold tracking-wider text-gray-500">
          {minOrderText}
        </span>
      </div>
    </header>
  );
};

export default Header;
