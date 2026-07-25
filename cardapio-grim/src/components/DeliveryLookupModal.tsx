import { useState, useRef } from 'react';
import { Phone, Search, Loader2, MapPin, Truck, Store, Edit2 } from 'lucide-react';

interface DeliveryLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastOrders: any[];
  companySlug: string;
  onDeliveryCalculated: (fee: number, isPickup: boolean, addressInfo?: any, name?: string, phone?: string) => void;
  apiBaseUrl: string;
}

export function DeliveryLookupModal({
  isOpen,
  onClose,
  pastOrders,
  companySlug,
  onDeliveryCalculated,
  apiBaseUrl
}: DeliveryLookupModalProps) {
  const [initialPhone, setInitialPhone] = useState('');
  const [initialCep, setInitialCep] = useState('');
  const [initialNumber, setInitialNumber] = useState(''); 
  const [initialSearching, setInitialSearching] = useState(false);
  const [initialResult, setInitialResult] = useState<any>(null);
  const [initialError, setInitialError] = useState('');
  const [selectedMode, setSelectedMode] = useState<'delivery' | 'pickup'>('delivery');

  const numberInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleInitialPhoneSearch = async () => {
    const cleanPhone = initialPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setInitialError('Digite um número de telefone válido.');
      return;
    }
    setInitialError('');
    setInitialSearching(true);
    setInitialResult(null);

    const existingOrders = pastOrders
      .filter(o => o.customer_phone && o.customer_phone.replace(/\D/g, '') === cleanPhone)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (existingOrders.length > 0) {
      const lastOrder = existingOrders[0];
      const addressInfo = {
        street: lastOrder.delivery_street, 
        number: lastOrder.delivery_number,
        neighborhood: lastOrder.delivery_neighborhood, 
        city: lastOrder.delivery_city,
        state: lastOrder.delivery_state, 
        cep: lastOrder.delivery_cep,
        full: lastOrder.delivery_address,
      };
      
      setInitialResult({ customer_name: lastOrder.customer_name, address: addressInfo });
      // Enviamos explicitamente o addressInfo construído aqui
      await handleRealFeeCalculation(addressInfo.full, addressInfo);
    } else {
      setInitialResult({ isNew: true });
      setInitialSearching(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length > 8) rawValue = rawValue.slice(0, 8);
    
    let maskedValue = rawValue;
    if (rawValue.length > 5) maskedValue = `${rawValue.slice(0, 5)}-${rawValue.slice(5)}`;
    
    setInitialCep(maskedValue);
    setInitialError('');
    
    if (rawValue.length === 8) {
      setTimeout(() => numberInputRef.current?.focus(), 50);
    }
  };

  const handleInitialCepSearch = async () => {
    const cleanCep = initialCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setInitialError('Digite um CEP válido com 8 dígitos.');
      return;
    }
    if (!initialNumber.trim()) {
      setInitialError('Por favor, informe o número do endereço antes de buscar.');
      numberInputRef.current?.focus();
      return;
    }

    setInitialError('');
    setInitialSearching(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setInitialError('CEP não encontrado.');
        setInitialSearching(false);
        return;
      }
      
      // Cria o objeto e já embute no state
      const addressInfo = { 
        street: data.logradouro, 
        number: initialNumber, 
        neighborhood: data.bairro, 
        city: data.localidade, 
        state: data.uf, 
        cep: cleanCep,
        full: `${data.logradouro}, ${initialNumber}, ${data.bairro}, ${data.localidade} - ${data.uf}, Brasil`
      };
      
      setInitialResult((prev: any) => ({ ...prev, address: addressInfo }));
      
      // Enviamos explicitamente o addressInfo construído aqui
      await handleRealFeeCalculation(addressInfo.full, addressInfo);

    } catch (e) {
      setInitialError('Falha ao buscar CEP.');
      setInitialSearching(false);
    }
  };

  const handleEditAddress = () => {
    setInitialResult((prev: any) => ({ 
      ...prev, 
      address: null, 
      delivery: null,
      isNew: true 
    }));
    setInitialCep('');
    setInitialNumber('');
    setInitialError('');
  };

  // A função agora OBRIGATÓRIAMENTE recebe e salva o objeto do endereço na resposta do cálculo
  const handleRealFeeCalculation = async (fullAddress: string, safeAddressObject: any) => {
    if (!companySlug || !fullAddress) {
      setInitialSearching(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/orders/${companySlug}/calculate-delivery/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_address: fullAddress }),
      });

      const data = await response.json();

      if (response.ok) {
        const deliveryInfo = {
          delivers: true,
          fee: data.taxa_frete,
          message: `Distância real: ${data.distancia_texto} (${data.distancia_km} km)`,
          // Salva uma CÓPIA DE SEGURANÇA do endereço DENTRO do objeto de delivery
          safeAddress: safeAddressObject 
        };
        setInitialResult((prev: any) => ({ ...prev, delivery: deliveryInfo, address: safeAddressObject }));
      } else {
        const deliveryInfo = {
          delivers: false,
          fee: 0,
          message: data.error || 'Endereço fora da área de entrega.',
          safeAddress: safeAddressObject
        };
        setInitialResult((prev: any) => ({ ...prev, delivery: deliveryInfo, address: safeAddressObject }));
      }
    } catch (e) {
      setInitialError('Erro de conexão ao calcular o frete.');
    } finally {
      setInitialSearching(false);
    }
  };

  const getFormattedAddress = (address: any) => {
    if (!address) return "Endereço não informado.";
    if (address.full && !address.street) return address.full;
    let addr = `${address.street || 'Rua não informada'}, ${address.number || 'S/N'}`;
    if (address.neighborhood) addr += ` - ${address.neighborhood}`;
    if (address.city) addr += `, ${address.city}/${address.state}`;
    return addr;
  };

  const handleConfirm = () => {
    const nameToPass = initialResult?.customer_name || ''; 
    const phoneToPass = initialPhone;

    // A MÁGICA ESTÁ AQUI: Nós tentamos pegar o endereço principal. Se o React enlouqueceu e deletou,
    // nós pegamos a cópia de segurança que salvamos dentro de 'delivery' no cálculo de frete!
    const guaranteedAddress = initialResult?.address || initialResult?.delivery?.safeAddress || null;

    if (selectedMode === 'pickup') {
      onDeliveryCalculated(0, true, null, nameToPass, phoneToPass);
    } else if (initialResult?.delivery?.delivers) {
      // Usando a variável garantida aqui
      onDeliveryCalculated(initialResult.delivery.fee, false, guaranteedAddress, nameToPass, phoneToPass);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Identificação de Entrega / Retirada</h2>
            <p className="text-xs text-slate-300">Escolha como deseja receber seu pedido</p>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* ABAS DE ESCOLHA: DELIVERY VS RETIRADA */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <button 
              type="button" 
              onClick={() => setSelectedMode('delivery')} 
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedMode === 'delivery' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Truck className="w-4 h-4 text-teal-600" /> Delivery
            </button>
            <button 
              type="button" 
              onClick={() => setSelectedMode('pickup')} 
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedMode === 'pickup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Store className="w-4 h-4 text-purple-600" /> Retirar na Loja
            </button>
          </div>

          {selectedMode === 'delivery' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Número de Telefone (WhatsApp)</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="tel" 
                      placeholder="(11) 99999-9999" 
                      value={initialPhone} 
                      onChange={e => {
                        setInitialPhone(e.target.value);
                        setInitialResult(null);
                      }} 
                      className="w-full pl-9 p-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-black shadow-sm" 
                    />
                  </div>
                  <button onClick={handleInitialPhoneSearch} disabled={initialSearching} className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-400 flex items-center gap-2 font-medium">
                    {initialSearching && !initialResult ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Continuar
                  </button>
                </div>
              </div>

              {initialSearching && <div className="flex justify-center items-center gap-2 text-gray-500 py-4"><Loader2 className="h-5 w-5 animate-spin text-teal-600" /><span>Calculando...</span></div>}
              {initialError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{initialError}</p>}

              {initialResult && (
                <div className="space-y-4 pt-3 border-t border-gray-200">
                  {initialResult.customer_name && (
                    <p className="font-semibold text-gray-800">Olá, <span className="text-teal-600">{initialResult.customer_name}</span>! Encontramos seu cadastro anterior.</p>
                  )}
                  
                  {initialResult.address && (
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Endereço de Entrega:</p>
                          <p className="text-sm text-gray-800 font-medium">{getFormattedAddress(initialResult.address)}</p>
                        </div>
                        <button 
                          onClick={handleEditAddress}
                          className="text-teal-600 hover:text-teal-800 flex items-center gap-1 text-xs font-bold px-2 py-1 bg-white rounded-md border border-teal-100 shadow-sm"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {(initialResult.isNew || (initialResult.address === null && !initialResult.delivery)) && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-lg">
                      <p className="font-semibold text-gray-800 text-sm">Por favor, informe seu endereço para calcular a taxa:</p>
                      
                      <div className="grid grid-cols-12 gap-2">
                        {/* CEP */}
                        <div className="col-span-8">
                          <label className="block text-xs font-medium text-gray-700 mb-1">CEP</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                              type="tel" 
                              placeholder="00000-000" 
                              value={initialCep} 
                              onChange={handleCepChange} 
                              maxLength={9} 
                              className="w-full pl-9 p-2.5 border-2 border-gray-200 shadow-sm rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-black text-sm" 
                            />
                          </div>
                        </div>
                        
                        {/* NÚMERO DA CASA */}
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Nº</label>
                          <input 
                            ref={numberInputRef}
                            type="text" 
                            placeholder="Ex: 100" 
                            value={initialNumber} 
                            onChange={e => setInitialNumber(e.target.value)} 
                            className="w-full p-2.5 border-2 border-gray-200 shadow-sm rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-black text-sm" 
                          />
                        </div>
                      </div>

                      <button onClick={handleInitialCepSearch} disabled={initialSearching} className="w-full py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400 flex items-center justify-center gap-2 font-medium">
                        {initialSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar e Calcular
                      </button>
                    </div>
                  )}

                  {initialResult.delivery && (
                    <div className={`p-4 rounded-xl border-2 ${initialResult.delivery.delivers ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                      <div className="flex items-center gap-3">
                        <Truck className={`h-8 w-8 shrink-0 ${initialResult.delivery.delivers ? 'text-green-600' : 'text-red-600'}`} />
                        <div>
                          <p className={`text-base font-bold ${initialResult.delivery.delivers ? 'text-green-800' : 'text-red-800'}`}>
                            {initialResult.delivery.delivers 
                              ? `Taxa de Entrega: R$ ${Number(initialResult.delivery.fee).toFixed(2).replace('.', ',')}`
                              : 'Entrega Indisponível'}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">{initialResult.delivery.message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-purple-50 text-purple-900 border border-purple-100 space-y-2">
              <p className="font-bold text-base">Retirada na Loja Ativa!</p>
              <p className="text-sm opacity-90">Você buscará o seu pedido diretamente no balcão do estabelecimento. Nenhuma taxa de entrega será cobrada.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end items-center bg-gray-50">
          <button 
            type="button" 
            onClick={handleConfirm} 
            disabled={selectedMode === 'delivery' && (!initialResult?.delivery || !initialResult.delivery.delivers)}
            className="w-full py-3 text-sm font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {selectedMode === 'pickup' 
              ? "Avançar para o Cardápio (Retirada)" 
              : (initialResult?.delivery?.delivers ? "Avançar para o Cardápio" : "Informe seu telefone e CEP acima")}
          </button>
        </div>
      </div>
    </div>
  );
}