import { User } from 'lucide-react';

interface CheckoutCustomerFormProps {
  customerName: string;
  setCustomerName: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
}

export function CheckoutCustomerForm({ 
  customerName, 
  setCustomerName, 
  customerPhone, 
  setCustomerPhone 
}: CheckoutCustomerFormProps) {

  // Função inteligente para formatar o número de telefone (Brasil) em tempo real
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Remove tudo o que não for número
    let value = e.target.value.replace(/\D/g, ''); 
    
    // 2. Limita a um máximo de 11 dígitos (DDD + 9 dígitos)
    if (value.length > 11) {
      value = value.slice(0, 11); 
    }

    // 3. Aplica a máscara progressiva: (XX) XXXXX-XXXX
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }

    setCustomerPhone(value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
        <User className="w-4 h-4 text-teal-600" /> Seus Dados
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Nome Completo *
          </label>
          <input 
            required 
            type="text" 
            placeholder="Como quer ser chamado..." 
            value={customerName} 
            onChange={e => setCustomerName(e.target.value)} 
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" 
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            WhatsApp / Celular (Válido) *
          </label>
          <input 
            required 
            type="tel" 
            placeholder="(11) 99999-9999" 
            maxLength={15} // Tamanho exato da máscara: (XX) XXXXX-XXXX
            value={customerPhone} 
            onChange={handlePhoneChange} 
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" 
          />
        </div>
      </div>
    </div>
  );
}