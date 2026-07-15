// src/components/SuccessModal.tsx
import { useState } from 'react';

interface SuccessModalProps {
  pixCode: string;
  onClose: () => void;
}

const SuccessModal = ({ pixCode, onClose }: SuccessModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500); // Reset button text after 2.5s
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center text-gray-800">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Pedido Realizado!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Agora só falta pagar com o Pix para confirmarmos seu pedido.
        </p>

        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <p className="text-xs text-gray-500 mb-1">Código Pix Copia e Cola:</p>
          <p className="text-sm break-all font-mono">{pixCode}</p>
        </div>

        <button
          onClick={handleCopy}
          className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${
            copied ? 'bg-green-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {copied ? 'Copiado com Sucesso!' : 'Copiar Código'}
        </button>
        <button onClick={onClose} className="mt-2 text-sm text-gray-500 hover:underline">
          Fechar
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;