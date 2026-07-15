// src/pages/MenuPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// Tipos
import type { CatalogData, Product, CartItem } from '../types/index.tsx';

// Componentes
import Header from '../components/Header.tsx';
import CategoryCarousel from '../components/CategoryCarousel.tsx';
import ProductList from '../components/ProductList.tsx';
import CartDrawer from '../components/CartDrawer.tsx';
import Spinner from '../components/Spinner.tsx';
import NotFound from '../pages/NotFound.tsx';

const MenuPage = () => {
  const { company_slug } = useParams<{ company_slug: string }>();
  
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!company_slug) return;

    const fetchCatalog = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`<https://web-production-6e1d8.up.railway.app/api/catalog/${company_slug}/>`);
        if (response.status === 404) {
          throw new Error('Restaurante não encontrado.');
        }
        if (!response.ok) {
          throw new Error('Ocorreu um erro ao buscar o cardápio.');
        }
        const data: CatalogData = await response.json();
        setCatalog(data);
        // Define a primeira categoria como selecionada por padrão
        if (data.categories && data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [company_slug]);

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // Aumenta a quantidade se o item já existe
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Adiciona novo item ao carrinho
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Filtra os produtos com base na categoria selecionada
  const filteredProducts = useMemo(() => {
    if (!catalog || !selectedCategory) return [];
    const category = catalog.categories.find(cat => cat.id === selectedCategory);
    return category ? category.products : [];
  }, [catalog, selectedCategory]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <NotFound message={error} />;
  }

  if (!catalog) {
    return null; // ou outra UI de fallback
  }

  return (
    // Aplicando a cor de fundo dinâmica
    <div className="min-h-screen" style={{ backgroundColor: catalog.theme.background }}>
      <Header
        name={catalog.name}
        coverImage={catalog.cover_image}
        isOpen={catalog.is_open}
      />
      
      <main className="p-4 pb-24"> {/* Padding-bottom para não sobrepor o CartDrawer */}
        <CategoryCarousel
          categories={catalog.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          theme={catalog.theme}
        />
        
        <ProductList
          products={filteredProducts}
          onAddToCart={handleAddToCart}
        />
      </main>

      <CartDrawer cart={cart} theme={catalog.theme} />
    </div>
  );
};

export default MenuPage;
