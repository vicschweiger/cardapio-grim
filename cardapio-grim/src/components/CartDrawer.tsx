// src/components/CartDrawer.tsx
import { useMemo } from 'react';
import type { CartItem, ThemeColors } from '../types';

interface CartDrawerProps {
  cart: CartItem[];
  theme: ThemeColors;
}

const CartDrawer = ({ cart, theme }: CartDrawerProps) => {
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0), 
  [cart]);

  if (totalItems === 0) {
    return null; // Não renderiza nada se o carrinho estiver vazio
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <p className="text-gray-600">{totalItems} {totalItems > 1 ? 'itens' : 'item'}</p>
          <p className="font-bold text-lg">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
          </p>
        </div>
        <button 
          className="text-white font-bold py-3 px-6 rounded-lg"
          style={{ backgroundColor: theme.primary, color: theme.text }}
        >
          Avançar
        </button>
      </div>
    </div>
  );
};

export default CartDrawer;
