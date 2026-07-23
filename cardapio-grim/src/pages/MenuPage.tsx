// src/pages/MenuPage.tsx
import { useState, useEffect, useMemo, useContext } from 'react';
import { useParams } from 'react-router-dom';

// Componentes
import Header from '../components/Header.tsx';
import CategoryCarousel from '../components/CategoryCarousel.tsx';
import ProductList from '../components/ProductList.tsx';
import CartDrawer from '../components/CartDrawer.tsx';
import Spinner from '../components/Spinner.tsx';
import NotFound from '../pages/NotFound.tsx';
import { DeliveryLookupModal } from '../components/DeliveryLookupModal.tsx';

// Contexto
import { CatalogContext } from '../context/CatalogContext.tsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api';

const MenuPage = () => {
  const { company_slug } = useParams<{ company_slug: string }>();
  
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("MenuPage deve ser renderizada dentro de um CatalogProvider");
  }

  const {
    catalog,
    loading,
    error,
    cart,
    fetchCatalog,
    handleAddToCart,
    handleSubtractFromCart
  } = context;

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // ESTADOS DO MODAL E FRETE
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(true);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Busca inicial do Catálogo
  useEffect(() => {
    if (company_slug) {
      fetchCatalog(company_slug);
    }
  }, [company_slug, fetchCatalog]);

  // Busca pedidos anteriores da empresa para cruzar com o telefone digitado
  useEffect(() => {
    const fetchCompanyOrders = async () => {
      if (!company_slug) return;
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${company_slug}/`);
        if (response.ok) {
          const data = await response.json();
          setPastOrders(data);
        }
      } catch (e) {
        console.error("Falha ao buscar histórico de pedidos", e);
      }
    };
    fetchCompanyOrders();
  }, [company_slug]);

  const handleDeliveryCalculated = (fee: number, isPickup: boolean) => {
    setDeliveryFee(isPickup ? 0 : fee);
    setIsLookupModalOpen(false);
  };

  // Define a primeira categoria como selecionada automaticamente ao carregar
  useEffect(() => {
    if (catalog?.categories && catalog.categories.length > 0 && selectedCategory === null) {
      setSelectedCategory(catalog.categories[0].id);
    }
  }, [catalog, selectedCategory]);

  const formattedCategories = useMemo(() => {
    if (!catalog) return [];
    return catalog.categories.map(cat => ({
      ...cat,
      name: cat.name ? cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase() : '',
      products: cat.products.map(prod => ({
        ...prod,
        name: prod.name ? prod.name.charAt(0).toUpperCase() + prod.name.slice(1).toLowerCase() : '',
        description: prod.description ? prod.description.charAt(0).toUpperCase() + prod.description.slice(1) : ''
      }))
    }));
  }, [catalog]);

  const filteredProducts = useMemo(() => {
    if (!formattedCategories || selectedCategory === null) return [];
    const category = formattedCategories.find(cat => cat.id === selectedCategory);
    return category ? category.products : [];
  }, [formattedCategories, selectedCategory]);

  if (loading && !catalog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <NotFound message={error} />;
  }

  if (!catalog) {
    return null;
  }

  const primaryColor = catalog.theme?.primary || '#27272a';
  const backgroundColor = catalog.theme?.background || '#fafaf9';

  return (
    <div 
      className="min-h-screen font-sans transition-colors duration-300 relative overflow-hidden" 
      style={{ backgroundColor }}
    >
      {/* COMPONENTE DA TELA INICIAL (MODAL DE IDENTIFICAÇÃO E RETIRADA) */}
      <DeliveryLookupModal 
        isOpen={isLookupModalOpen}
        onClose={() => setIsLookupModalOpen(false)}
        pastOrders={pastOrders}
        companySlug={company_slug!}
        onDeliveryCalculated={handleDeliveryCalculated}
        apiBaseUrl={API_BASE_URL}
      />

      {/* HEADER DINÂMICO */}
      <div className="w-full bg-white/5 shadow-sm relative z-10">
        <Header
          name={catalog.name}
          coverImage={catalog.cover_image}
          logoUrl={catalog.logo_url}
          isOpen={catalog.is_open}
        />
      </div>
      
      {/* CORPO PRINCIPAL */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-4 pb-32 animate-fade-in-up gap-5 flex flex-col relative z-10 min-h-screen shadow-2xl shadow-black/5"> 
        
        {!catalog.is_open && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-center">
            <p className="text-sm font-medium text-red-800">
              Estamos fechados no momento! Você ainda pode ver o cardápio, mas não será possível enviar pedidos.
            </p>
          </div>
        )}
        
        <div 
          className="sticky top-2 z-30 w-full h-full shadow-sm/30 backdrop-blur-md transition-all border border-stone-200/40 rounded-xl"
          style={{ backgroundColor: `${backgroundColor}E6` }} 
        >
          <CategoryCarousel
            categories={formattedCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            theme={catalog.theme}
          />
        </div>
        
        <div className="min-h-[50vh] mt-2">
          <ProductList 
            products={filteredProducts}
            cart={cart}
            primaryColor={primaryColor}
            onAddToCart={handleAddToCart}
            onSubtractFromCart={handleSubtractFromCart}
          />
        </div>

      </main>

      {/* CARRINHO COM A TAXA DE ENTREGA */}
      <CartDrawer 
        cart={cart} 
        theme={catalog.theme} 
        companySlug={company_slug!} 
        deliveryFee={deliveryFee} 
      />
    </div>
  );
};

export default MenuPage;