import { useState } from 'react';
import { MapPin, Truck, Store, Loader2, Search } from 'lucide-react';

interface CheckoutDeliveryFormProps {
  isPickup: boolean;
  setIsPickup: (val: boolean) => void;
  // Campos fragmentados de endereço
  deliveryCep: string;
  setDeliveryCep: (val: string) => void;
  deliveryStreet: string;
  setDeliveryStreet: (val: string) => void;
  deliveryNumber: string;
  setDeliveryNumber: (val: string) => void;
  deliveryComplement: string;
  setDeliveryComplement: (val: string) => void;
  deliveryNeighborhood: string;
  setDeliveryNeighborhood: (val: string) => void;
  deliveryCity: string;
  setDeliveryCity: (val: string) => void;
  deliveryState: string;
  setDeliveryState: (val: string) => void;
  deliveryInstructions: string;
  setDeliveryInstructions: (val: string) => void;
}

export function CheckoutDeliveryForm({ 
  isPickup, 
  setIsPickup, 
  deliveryCep, 
  setDeliveryCep,
  deliveryStreet,
  setDeliveryStreet,
  deliveryNumber,
  setDeliveryNumber,
  deliveryComplement,
  setDeliveryComplement,
  deliveryNeighborhood,
  setDeliveryNeighborhood,
  deliveryCity,
  setDeliveryCity,
  deliveryState,
  setDeliveryState,
  deliveryInstructions, 
  setDeliveryInstructions 
}: CheckoutDeliveryFormProps) {

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  // Lógica Robusta: Máscara e Busca automática do CEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Remove tudo o que não for número (impede letras)
    let rawValue = e.target.value.replace(/\D/g, ''); 
    
    // 2. Trava em no máximo 8 números
    if (rawValue.length > 8) {
      rawValue = rawValue.slice(0, 8);
    }
    
    // 3. Aplica a máscara visual "00000-000"
    let maskedValue = rawValue;
    if (rawValue.length > 5) {
      maskedValue = `${rawValue.slice(0, 5)}-${rawValue.slice(5)}`;
    }
    
    setDeliveryCep(maskedValue);
    setCepError('');

    // 4. Se tiver exatos 8 números, dispara a busca sozinho
    if (rawValue.length === 8) {
      await fetchAddressFromViaCep(rawValue);
    }
  };

  const fetchAddressFromViaCep = async (cep: string) => {
    setIsLoadingCep(true);
    setCepError('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado. Digite o endereço manualmente.');
        // Limpa os campos para o cliente digitar se falhar
        setDeliveryStreet('');
        setDeliveryNeighborhood('');
        setDeliveryCity('');
        setDeliveryState('');
        return;
      }

      // Preenche os campos magicamente
      setDeliveryStreet(data.logradouro || '');
      setDeliveryNeighborhood(data.bairro || '');
      setDeliveryCity(data.localidade || '');
      setDeliveryState(data.uf || '');
      
      // Foca automaticamente no campo "Número" para o usuário continuar digitando
      document.getElementById('input-delivery-number')?.focus();

    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepError('Falha ao buscar o CEP. Digite manualmente.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-teal-600" /> Forma de Entrega
      </h3>
      
      <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl border border-gray-200/40">
        <button type="button" onClick={() => setIsPickup(false)} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${!isPickup ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}>
          <Truck className="w-4 h-4" /> Delivery
        </button>
        <button type="button" onClick={() => setIsPickup(true)} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isPickup ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}>
          <Store className="w-4 h-4" /> Retirar no Balcão
        </button>
      </div>

      {!isPickup ? (
        <div className="space-y-4 animate-fade-in-up">
          
          {/* CAMPO: CEP COM BUSCA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">CEP de Entrega *</label>
              <div className="relative">
                <input 
                  required={!isPickup} 
                  type="tel" // 'tel' abre o teclado numérico no celular, melhorando a UX
                  maxLength={9} // Limite da máscara (8 números + 1 traço)
                  placeholder="00000-000" 
                  value={deliveryCep} 
                  onChange={handleCepChange} 
                  className={`w-full rounded-lg border p-2.5 text-sm outline-none transition-colors pr-10 ${cepError ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 bg-gray-50 focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500'}`} 
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {isLoadingCep ? (
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  ) : (
                    <Search className={`h-4 w-4 ${cepError ? 'text-red-400' : 'text-gray-400'}`} />
                  )}
                </div>
              </div>
              {cepError && <p className="text-xs text-red-500 mt-1 font-medium">{cepError}</p>}
            </div>
            
            {/* Espaço vazio no grid no Desktop para empurrar os próximos campos para baixo */}
            <div className="hidden sm:block"></div>
          </div>

          {/* CAMPOS PREENCHIDOS PELO CEP */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Logradouro / Rua *</label>
              <input required={!isPickup} type="text" placeholder="Ex: Avenida Paulista" value={deliveryStreet} onChange={e => setDeliveryStreet(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Número *</label>
              <input id="input-delivery-number" required={!isPickup} type="text" placeholder="Ex: 1000" value={deliveryNumber} onChange={e => setDeliveryNumber(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Complemento</label>
              <input type="text" placeholder="Apto, bloco, fundos..." value={deliveryComplement} onChange={e => setDeliveryComplement(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
            </div>
            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bairro *</label>
              <input required={!isPickup} type="text" placeholder="Ex: Bela Vista" value={deliveryNeighborhood} onChange={e => setDeliveryNeighborhood(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-9">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cidade *</label>
              <input required={!isPickup} type="text" placeholder="Sua cidade" value={deliveryCity} onChange={e => setDeliveryCity(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">UF *</label>
              <input required={!isPickup} type="text" placeholder="SP" maxLength={2} value={deliveryState} onChange={e => setDeliveryState(e.target.value.toUpperCase())} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors uppercase text-center" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Instruções para o Entregador</label>
            <input type="text" placeholder="Portão cor verde, deixar na portaria, etc..." value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
          </div>

        </div>
      ) : (
        <div className="p-4 rounded-lg bg-purple-50 text-purple-800 text-xs font-medium border border-purple-100 flex gap-2 items-start animate-fade-in-up">
          <Store className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Retirada Sem Taxas ativa!</p>
            <p className="mt-0.5 opacity-90">Busque o seu pedido diretamente no balcão do estabelecimento assim que o status mudar para pronto.</p>
          </div>
        </div>
      )}
    </div>
  );
}