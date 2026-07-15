// src/components/ProductCard.tsx
import type { Product } from '../types/index.tsx';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden flex items-center p-3 space-x-4">
    <img src={product.image_url} alt={product.name} className="w-24 h-24 object-cover rounded-md" />
    <div className="flex-1">
      <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
      <div className="flex justify-between items-center mt-2">
        <span className="text-lg font-bold text-gray-900">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(product.price))}
        </span>
        <button 
          onClick={() => onAddToCart(product)}
          className="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold hover:bg-gray-700 transition-colors"
          aria-label={`Adicionar ${product.name} ao carrinho`}
        >
          +
        </button>
      </div>
    </div>
  </div>
);

export default ProductCard;
