import { Edit, Trash2, Tag } from 'lucide-react';
import type { Product } from '../../types';

interface ProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number | string) => void;
}

const formatCurrency = (value: number | string | null | undefined) => {
  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : (value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num);
};

export const ProductGrid = ({ products, onEdit, onDelete }: ProductGridProps) => {
  if (products.length === 0) {
    return <p className="text-center text-gray-500 py-10">Nenhum produto encontrado para este filtro.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <div key={product.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 flex-grow">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
              {product.is_promotional && (
                <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                  <Tag className="w-3 h-3" />
                  Promo
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
              {product.is_promotional && product.original_price ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-red-600">{formatCurrency(product.price)}</span>
                  <span className="text-sm text-gray-400 line-through">{formatCurrency(product.original_price)}</span>
                </div>
              ) : (
                <span className="text-xl font-bold text-gray-800">{formatCurrency(product.price)}</span>
              )}
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                {product.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(product)} className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-600">
                <Edit className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => onDelete(product.id)} className="flex-1 bg-red-500 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-600">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};