import React from 'react';

interface HeaderProps {
  name: string;
  coverImage?: string; // Mantido como opcional caso queira usar futuramente
  logoUrl?: string;    // <-- Propriedade que receberá a string Base64 ou URL padrão
  isOpen: boolean;
}

const Header = ({ name, logoUrl, isOpen }: HeaderProps) => {
  return (
    <header className="bg-white w-full border-b border-gray-100 shadow-sm relative z-10">
      {/* max-w-3xl garante que o header fique perfeitamente alinhado com a lista de produtos no Desktop */}
      <div className="max-w-3xl mx-auto flex items-center gap-4 px-4 py-6 sm:px-6">
        
        {/* AVATAR / LOGO */}
        <div className="shrink-0 relative">
          {logoUrl ? (
            // Container com fundo branco e padding para a imagem respirar e não encostar nas bordas
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden p-1.5">
              <img
                src={logoUrl}
                alt={`Logo de ${name}`}
                // object-contain garante que a imagem caiba inteira sem cortar, mantendo a proporção original
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            // Fallback elegante caso a empresa ainda não tenha logo
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200 shadow-sm">
              <span className="text-gray-400 text-3xl sm:text-4xl font-bold uppercase">
                {name ? name.charAt(0) : ''}
              </span>
            </div>
          )}
        </div>

        {/* INFORMAÇÕES DO RESTAURANTE */}
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-none mb-2 capitalize">
            {name}
          </h1>

          {/* STATUS COM INDICADOR PULSANTE (UX Premium) */}
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3 items-center justify-center">
              {isOpen && (
                // Animação de 'Ping' (Pulsar) apenas quando estiver aberto
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              {/* Ponto estático central */}
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
    </header>
  );
};

export default Header;