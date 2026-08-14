import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Product, Category } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit: Product | null;
  categories: Category[];
}

export const ProductModal = ({ isOpen, onClose, onSave, productToEdit, categories }: ProductModalProps) => {
  const [product, setProduct] = useState<Partial<Product>>({});
  const [isPromotional, setIsPromotional] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setProduct(productToEdit);
        setIsPromotional(productToEdit.is_promotional || false);
      } else {
        setProduct({
          name: '',
          description: '',
          price: '0',
          category_id: categories[0]?.id || undefined,
          is_active: true,
          is_promotional: false,
          original_price: null,
        });
        setIsPromotional(false);
      }
    }
  }, [productToEdit, isOpen, categories]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (name === 'is_promotional') {
      setIsPromotional(checked);
      setProduct(prev => ({
        ...prev,
        is_promotional: checked,
        original_price: checked ? (prev.original_price || prev.price) : null,
      }));
    } else {
      setProduct(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalProduct = {
      ...product,
      price: String(product.price || '0').replace(',', '.'),
      original_price: isPromotional ? String(product.original_price || '0').replace(',', '.') : null,
      is_promotional: isPromotional,
    };
    onSave(finalProduct as Product);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{productToEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
            <input type="text" name="name" value={product.name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg space-y-4">
            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input id="is_promotional" name="is_promotional" type="checkbox" checked={isPromotional} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor="is_promotional" className="font-medium text-gray-900">Ativar Preço Promocional</label>
                <p className="text-gray-500">Marque para definir um preço de promoção e um preço original.</p>
              </div>
            </div>

            {isPromotional ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                <div>
                  <label className="block text-sm font-medium text-red-700">Preço Promocional (R$)</label>
                  <input type="text" name="price" value={product.price || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço Original (R$)</label>
                  <input type="text" name="original_price" value={product.original_price || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço Padrão (R$)</label>
                <input type="text" name="price" value={product.price || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Salvar Produto</button>
          </div>
        </form>
      </div>
    </div>
  );
};
