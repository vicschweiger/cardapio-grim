// src/components/ProductList.tsx
import type { Product } from '../types/index.tsx';
import ProductCard from './ProductCard.tsx';

interface ProductListProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductList = ({ products, onAddToCart }: ProductListProps) => (
  <div className="grid grid-cols-1 gap-4">
    {products.map((product) => (
      <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
    ))}
  </div>
);

export default ProductList;
