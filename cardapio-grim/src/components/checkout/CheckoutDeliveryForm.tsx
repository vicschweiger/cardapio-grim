import { useState } from 'react';
import { MapPin, Truck, Store, Loader2, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CheckoutDeliveryFormProps {
  isPickup: boolean;
  setIsPickup: (val: boolean) => void;
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
  
  // NOVAS PROPS PARA O CÁLCULO DE FRETE
  companyToken: string; 
  onDeliveryCalculated: (fee: number) => void; 
  setDeliveryBlocked: (isBlocked: boolean) => void; // Avisa a página pai para bloquear o botão de Checkout
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
  setDeliveryInstructions,
  companyToken,
  onDeliveryCalculated,
  setDeliveryBlocked
}: CheckoutDeliveryFormProps) {

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  // ESTADOS DO CÁLCULO DE FRETE (Estes ficam aqui para controlar a UI do formulário)
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [deliveryErrorMsg, setDeliveryErrorMsg] = useState('');
  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app';

  // Lógica Robusta: Máscara e Busca automática do CEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, ''); 
    
    if (rawValue.length > 8) {
      rawValue = rawValue.slice(0, 8);
    }
    
    let maskedValue = rawValue;
    if (rawValue.length > 5) {
      maskedValue = `${rawValue.slice(0, 5)}-${rawValue.slice(5)}`;
    }
    
    setDeliveryCep(maskedValue);
    setCepError('');
    // Ao mudar o CEP, reseta os cálculos anteriores
    setDeliveryErrorMsg('');
    setDeliverySuccessMsg('');
    setDeliveryBlocked(true); 

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
        setDeliveryStreet('');
        setDeliveryNeighborhood('');
        setDeliveryCity('');
        setDeliveryState('');
        return;
      }

      setDeliveryStreet(data.logradouro || '');
      setDeliveryNeighborhood(data.bairro || '');
      setDeliveryCity(data.localidade || '');
      setDeliveryState(data.uf || '');
      
      document.getElementById('input-delivery-number')?.focus();

    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepError('Falha ao buscar o CEP. Digite manualmente.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  // NOVA LÓGICA: Calcula o frete com o Django + Google Maps
  const handleCalculateDelivery = async () => {
    // Só calcula se os dados mínimos existirem
    if (!deliveryCep || !deliveryStreet || !deliveryNumber || !deliveryCity) return;

    setIsCalculatingDelivery(true);
    setDeliveryErrorMsg('');
    setDeliverySuccessMsg('');

    const fullAddress = `${deliveryStreet}, ${deliveryNumber}, ${deliveryCity} - ${deliveryState}, ${deliveryCep}`;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${companyToken}/calculate-delivery/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_address: fullAddress })
      });
      
      const data = await response.json();

      if (response.ok) {
        onDeliveryCalculated(data.taxa_frete);
        setDeliverySuccessMsg(`Distância: ${data.distancia_texto} - Taxa de Entrega: R$ ${data.taxa_frete.toFixed(2).replace('.', ',')}`);
        setDeliveryBlocked(false); // Libera o checkout
      } else {
        setDeliveryErrorMsg(data.error || 'Fora da área de cobertura.');
        onDeliveryCalculated(0);
        setDeliveryBlocked(true); // Bloqueia o checkout
      }
    } catch (error) {
      console.error("Erro na API de frete:", error);
      setDeliveryErrorMsg('Erro ao calcular a distância de entrega. Tente novamente.');
      setDeliveryBlocked(true);
    } finally {
      setIsCalculatingDelivery(false);
    }
  };

  // Se o cliente trocar para Retirada, libera o checkout e zera a taxa
  const handlePickupToggle = (pickup: boolean) => {
    setIsPickup(pickup);
    if (pickup) {
      setDeliveryErrorMsg('');
      setDeliveryBlocked(false);
      onDeliveryCalculated(0);
    } else {
      setDeliveryBlocked(true);
      // Se já tiver os dados, recalcula
      if (deliveryNumber && deliveryCep) handleCalculateDelivery();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-teal-600" /> Forma de Entrega
      </h3>
      
      <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl border border-gray-200/40">
        <button type="button" onClick={() => handlePickupToggle(false)} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${!isPickup ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}>
          <Truck className="w-4 h-4" /> Delivery
        </button>
        <button type="button" onClick={() => handlePickupToggle(true)} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${isPickup ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}>
          <Store className="w-4 h-4" /> Retirar no Balcão
        </button>
      </div>

      {!isPickup ? (
        <div className="space-y-4 animate-fade-in-up">
          
          {/* MENSAGENS DE ERRO OU SUCESSO DO FRETE */}
          {deliveryErrorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="font-medium">{deliveryErrorMsg}</p>
            </div>
          )}
          {deliverySuccessMsg && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 text-teal-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="font-medium">{deliverySuccessMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">CEP de Entrega *</label>
              <div className="relative">
                <input 
                  required={!isPickup} 
                  type="tel" 
                  maxLength={9} 
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
            <div className="hidden sm:block"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Logradouro / Rua *</label>
              <input required={!isPickup} type="text" placeholder="Ex: Avenida Paulista" value={deliveryStreet} onChange={e => setDeliveryStreet(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-50 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500 transition-colors" />
            </div>
            <div className="sm:col-span-4 relative">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Número *</label>
              <input 
                id="input-delivery-number" 
                required={!isPickup} 
                type="text" 
                placeholder="Ex: 1000" 
                value={deliveryNumber} 
                onChange={e => {
                  setDeliveryNumber(e.target.value);
                  setDeliveryBlocked(true); // Bloqueia até calcular novamente
                }} 
                onBlur={handleCalculateDelivery} // MÁGICA AQUI: Calcula ao sair do campo
                className={`w-full rounded-lg border p-2.5 text-sm bg-gray-50 outline-none transition-colors ${deliveryErrorMsg ? 'border-red-300 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500'}`} 
              />
              {isCalculatingDelivery && (
                <div className="absolute right-3 top-9">
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                </div>
              )}
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