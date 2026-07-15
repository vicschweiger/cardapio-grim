// src/components/CheckoutForm.tsx
import { useState, FormEvent } from 'react';
import type { CartItem, ThemeColors } from '../types';
import Input from './ui/Input.tsx';
import SuccessModal from '../pages/SuccessModal.tsx';

interface CheckoutFormProps {
  cart: CartItem[];
  theme: ThemeColors;
  companySlug: string;
}

const CheckoutForm = ({ cart, theme, companySlug }: CheckoutFormProps) => {
  const [customer, setCustomer] = useState({
    name: '',
    whatsapp: '',
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
  });
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);

    const payload = {
      customer_name: customer.name,
      customer_whatsapp: customer.whatsapp,
      delivery_address: `${customer.street}, ${customer.number}, ${customer.neighborhood} - ${customer.complement}`,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      // ATENÇÃO: A URL da API para criar o pedido é um exemplo.
      // Substitua pela URL correta da sua API Django.
      const response = await fetch(`https://web-production-6e1d8.up.railway.app/api/order/${companySlug}/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Não foi possível finalizar o pedido. Tente novamente.');
      }

      if (result.pix_copia_e_cola) {
        setPixCode(result.pix_copia_e_cola);
      } else {
        throw new Error('Resposta da API inválida. Não foi possível obter o código Pix.');
      }
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {pixCode && <SuccessModal pixCode={pixCode} onClose={() => setPixCode(null)} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome" name="name" id="name" value={customer.name} onChange={handleInputChange} required />
        <Input label="WhatsApp" name="whatsapp" id="whatsapp" type="tel" placeholder="(XX) 9XXXX-XXXX" value={customer.whatsapp} onChange={handleInputChange} required />
        
        <h2 className="text-xl font-semibold pt-4 border-t border-gray-500/20">Endereço de Entrega</h2>
        <Input label="Rua / Avenida" name="street" id="street" value={customer.street} onChange={handleInputChange} required />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Input label="Número" name="number" id="number" value={customer.number} onChange={handleInputChange} required />
          </div>
          <div className="col-span-2">
            <Input label="Bairro" name="neighborhood" id="neighborhood" value={customer.neighborhood} onChange={handleInputChange} required />
          </div>
        </div>
        <Input label="Complemento (Apto, Bloco, Ponto de Ref.)" name="complement" id="complement" value={customer.complement} onChange={handleInputChange} />

        {apiError && <p className="text-red-500 text-sm text-center">{apiError}</p>}

        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-3 px-6 rounded-lg transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.primary, color: theme.text }}
          >
            {loading ? 'Finalizando...' : 'Finalizar e Pagar por Pix'}
          </button>
        </div>
      </form>
    </>
  );
};

export default CheckoutForm;