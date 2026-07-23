import { useState } from 'react';
import { Phone, Search, Loader2, MapPin, Truck, Store } from 'lucide-react';

interface DeliveryLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastOrders: any[];
  companySlug: string;
  onDeliveryCalculated: (fee: number, isPickup: boolean, addressInfo?: any) => void;
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
  const [initialSearching, setInitialSearching] = useState(false);
  const [initialResult, setInitialResult] = useState<any>(null);
  const [initialError, setInitialError] = useState('');
  const [selectedMode, setSelectedMode] = useState<'delivery' | 'pickup'>('delivery');

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
      await handleRealFeeCalculation(addressInfo.full);
    } else {
      setInitialResult({ isNew: true });
      setInitialSearching(false);
    }
  };

  const handleInitialCepSearch = async () => {
    const cleanCep = initialCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setInitialError('Digite um CEP válido com 8 dígitos.');
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
      
      const addressInfo = { 
        street: data.logradouro, 
        neighborhood: data.bairro, 
        city: data.localidade, 
        state: data.uf, 
        cep: cleanCep 
      };
      
      setInitialResult(prev => ({ ...prev, address: addressInfo }));
      
      const fullAddressQuery = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, ${cleanCep}, Brasil`;
      await handleRealFeeCalculation(fullAddressQuery);

    } catch (e) {
      setInitialError('Falha ao buscar CEP.');
      setInitialSearching(false);
    }
  };

  const handleRealFeeCalculation = async (fullAddress: string) => {
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
          message: `Distância real: ${data.distancia_texto} (${data.distancia_km} km)`
        };
        setInitialResult((prev: any) => ({ ...prev, delivery: deliveryInfo }));
      } else {
        const deliveryInfo = {
          delivers: false,
          fee: 0,
          message: data.error || 'Endereço fora da área de entrega.'
        };
        setInitialResult((prev: any) => ({ ...prev, delivery: deliveryInfo }));
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
    if (selectedMode === 'pickup') {
      onDeliveryCalculated(0, true);
    } else if (initialResult?.delivery?.delivers) {
      onDeliveryCalculated(initialResult.delivery.fee, false, initialResult.address);
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
                      onChange={e => setInitialPhone(e.target.value)} 
                      className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-black" 
                    />
                  </div>
                  <button onClick={handleInitialPhoneSearch} disabled={initialSearching} className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-400 flex items-center gap-2 font-medium">
                    {initialSearching && !initialResult ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Continuar
                  </button>
                </div>
              </div>

              {initialSearching && <div className="flex justify-center items-center gap-2 text-gray-500 py-4"><Loader2 className="h-5 w-5 animate-spin text-teal-600" /><span>Buscando cadastro e calculando rota...</span></div>}
              {initialError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{initialError}</p>}

              {initialResult && (
                <div className="space-y-4 pt-3 border-t">
                  {initialResult.customer_name && (
                    <p className="font-semibold text-gray-800">Olá, <span className="text-teal-600">{initialResult.customer_name}</span>! Encontramos seu cadastro anterior.</p>
                  )}
                  {initialResult.isNew && (
                    <p className="font-semibold text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm">Número não encontrado nos pedidos anteriores. Informe seu CEP para calcularmos a taxa:</p>
                  )}

                  {initialResult.address && (
                    <div className="p-3.5 bg-gray-50 rounded-xl border">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Endereço Utilizado:</p>
                      <p className="text-sm text-gray-800 font-medium">{getFormattedAddress(initialResult.address)}</p>
                      {!initialResult.isNew && <p className="text-xs text-gray-400 mt-1">Endereço do seu último pedido.</p>}
                    </div>
                  )}
                  
                  {(initialResult.isNew || (initialResult.address && !initialResult.delivery)) && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Digite seu CEP</label>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input 
                            type="tel" 
                            placeholder="00000-000" 
                            value={initialCep} 
                            onChange={e => setInitialCep(e.target.value)} 
                            maxLength={9} 
                            className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-black" 
                          />
                        </div>
                        <button onClick={handleInitialCepSearch} disabled={initialSearching} className="px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400 flex items-center gap-2 font-medium">
                          {initialSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar CEP
                        </button>
                      </div>
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
              <p className="text-sm opacity-90">Você buscareá o seu pedido diretamente no balcão do estabelecimento. Nenhuma taxa de entrega será cobrada.</p>
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