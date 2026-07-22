// src/components/ProductList.tsx
import type { Product, CartItem } from '../types/index.tsx';
import ProductCard from './ProductCard.tsx';

interface ProductListProps {
  products: Product[];
  cart: CartItem[];
  primaryColor: string;
  onAddToCart: (product: Product) => void;
  onSubtractFromCart: (productId: string | number) => void;
}

export default function ProductList({
  products,
  cart,
  primaryColor,
  onAddToCart,
  onSubtractFromCart
}: ProductListProps) {
  
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
        <span className="text-4xl mb-3">🍽️</span>
        <p className="text-lg font-medium" style={{ color: primaryColor }}>
          Nenhum produto nesta categoria
        </p>
        <p className="text-sm text-gray-500 mt-1">Explore outras opções no menu acima.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {products.map(product => {
        // Encontra quantos deste produto estão no carrinho para passar para o Card
        const cartItem = cart.find(item => item.id === product.id);
        const quantityInCart = cartItem ? cartItem.quantity : 0;

        return (
          <ProductCard
            key={product.id}
            product={product}
            quantityInCart={quantityInCart}
            primaryColor={primaryColor}
            onAdd={onAddToCart}
            onSubtract={onSubtractFromCart}
          />
        );
      })}
    </div>
  );
}