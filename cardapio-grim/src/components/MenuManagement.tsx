import { useState, useEffect, useMemo } from 'react';
import { ProductGrid } from '../components/ProductGrid.tsx';
import { ProductModal } from '../components/ProductModal.tsx';
import type { Product, CatalogData } from '../types/index.tsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api';

async function fetchAdminCatalog(slug: string): Promise<CatalogData> {
  const response = await fetch(`${API_BASE_URL}/catalog/${slug}/`);
  if (!response.ok) {
    throw new Error('Falha ao buscar cardápio');
  }
  return response.json();
}

async function saveProduct(slug: string, product: Product): Promise<Product> {
  const url = product.id 
    ? `${API_BASE_URL}/products/${product.id}/`
    : `${API_BASE_URL}/catalogs/${slug}/products/`;
  const method = product.id ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' /* Adicione seu token de Auth aqui */ },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Falha ao salvar produto');
  }
  return response.json();
}

export const MenuManagement = () => {
  const companySlug = 'seu-slug-aqui'; // Substitua pelo slug da empresa logada
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | 'promo'>('all');

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminCatalog(companySlug);
      setCatalog(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [companySlug]);

  const allProducts = useMemo(() => {
    return catalog?.categories.flatMap(cat => cat.products) || [];
  }, [catalog]);

  const managementCategories = useMemo(() => {
    const hasPromotional = allProducts.some(p => p.is_promotional);
    // Filtra categorias com nome "Promoção" para não duplicar o filtro dinâmico.
    const baseCategories = (catalog?.categories || []).filter(
      c => !c.name.toLowerCase().includes('promoç')
    );
    
    const filters = [
      { id: 'all', name: 'Todos os Produtos' },
      ...(hasPromotional ? [{ id: 'promo', name: '🔥 Promoções' }] : []),
      ...baseCategories.map(c => ({ id: c.id, name: c.name })),
    ];
    return filters;
  }, [catalog, allProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedFilter === 'all') return allProducts;
    if (selectedFilter === 'promo') return allProducts.filter(p => p.is_promotional);
    
    const category = catalog?.categories.find(c => String(c.id) === String(selectedFilter));
    return category?.products || [];
  }, [selectedFilter, allProducts, catalog]);

  const handleOpenModal = (product: Product | null = null) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      await saveProduct(companySlug, product);
      setIsModalOpen(false);
      await loadCatalog(); // Recarrega o catálogo para ver as mudanças
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (productId: number | string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      console.log('Deletar produto com ID:', productId);
      // Adicione aqui a lógica da API para deletar o produto
    }
  };

  if (loading) return <div className="p-8">Carregando gestão de cardápio...</div>;
  if (error) return <div className="p-8 text-red-500">Erro: {error}</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Cardápio</h1>
        <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 shadow-sm">
          Adicionar Produto
        </button>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 border-b">
        {managementCategories.map(filter => (
          <button key={filter.id} onClick={() => setSelectedFilter(String(filter.id))} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedFilter === String(filter.id) ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {filter.name}
          </button>
        ))}
      </div>

      <ProductGrid products={filteredProducts} onEdit={handleOpenModal} onDelete={handleDeleteProduct} />

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} productToEdit={productToEdit} categories={catalog?.categories || []} />
    </div>
  );
};
