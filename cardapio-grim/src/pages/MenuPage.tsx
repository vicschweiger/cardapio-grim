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
import { DeliveryStatusBar } from '../components/DeliveryStatusBar.tsx';
import type { Category, Product } from '../types';
import { PrivacyFooter } from '../privacy/PrivacyFooter.tsx';

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

  const [selectedCategory, setSelectedCategory] = useState<number | string | null>(null);

  // 1. INICIALIZAÇÃO DA SESSÃO MAIS ROBUSTA
  const savedSession = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(`deliveryInfo_${company_slug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.isCompleted) return parsed;
      }
    } catch (e) {
      console.error("Erro ao ler sessionStorage", e);
    }
    return null;
  }, [company_slug]);

  // ESTADOS PRINCIPAIS DO CARDÁPIO E DO CLIENTE
  // Se tem sessão salva E completa, começa fechado. Senão, abre o modal.
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(savedSession ? false : true); 
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  
  const [deliveryFee, setDeliveryFee] = useState<number>(savedSession?.deliveryFee || 0);
  const [isPickup, setIsPickup] = useState<boolean>(savedSession?.isPickup || false);
  const [customerAddressInfo, setCustomerAddressInfo] = useState<any>(savedSession?.addressInfo || null);
  const [customerName, setCustomerName] = useState<string>(savedSession?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState<string>(savedSession?.customerPhone || '');

  useEffect(() => {
    if (company_slug) fetchCatalog(company_slug);
  }, [company_slug, fetchCatalog]);

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

  // FUNÇÃO QUE PROCESSA OS DADOS VINDOS DO MODAL
  const handleDeliveryCalculated = (fee: number, pickup: boolean, addressInfo?: any, name?: string, phone?: string) => {
    const calculatedFee = pickup ? 0 : fee;
    // Se o modal enviou nome/telefone, usa eles. Se enviou vazio/undefined, preserva o que já tinha no state (se tivesse).
    const finalName = name || customerName;
    const finalPhone = phone || customerPhone;
    
    setDeliveryFee(calculatedFee);
    setIsPickup(pickup);
    setCustomerAddressInfo(addressInfo || null); // Salva o endereço
    setCustomerName(finalName);
    setCustomerPhone(finalPhone);

    setIsLookupModalOpen(false); // Fecha o modal!

    // Salva TUDO na sessão
    sessionStorage.setItem(`deliveryInfo_${company_slug}`, JSON.stringify({
      deliveryFee: calculatedFee,
      isPickup: pickup,
      addressInfo: addressInfo || null, // Garante que salva o endereço na sessão
      customerName: finalName,
      customerPhone: finalPhone,
      isCompleted: true 
    }));
  };

  const handleOpenEditModal = () => setIsLookupModalOpen(true);

const formattedCategories = useMemo(() => {
    if (!catalog || !catalog.categories) return [];

    const categoryMap = new Map<string, Category>();
    const promotionalProducts: Product[] = [];

    // 1. Processa todas as categorias e produtos.
    catalog.categories.forEach(cat => {
        const cleanName = cat.name ? cat.name.trim() : '';
        const normalizedCatName = cleanName 
          ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase() 
          : 'Outros';

        const formattedProductsForCat = (cat.products || []).map(prod => {
            const formattedProd = {
                ...prod,
                name: prod.name ? prod.name.trim().charAt(0).toUpperCase() + prod.name.trim().slice(1).toLowerCase() : '',
                description: prod.description ? prod.description.trim().charAt(0).toUpperCase() + prod.description.trim().slice(1) : ''
            };

            // 2. Se for promocional, coleta para a aba de promoções.
            if (prod.is_promotional) {
                promotionalProducts.push(formattedProd);
            }
            return formattedProd;
        });

        // 3. Adiciona TODOS os produtos à sua categoria original (ou mescla se a categoria já existe)
        if (categoryMap.has(normalizedCatName)) {
            const existingCat = categoryMap.get(normalizedCatName)!;
            existingCat.products.push(...formattedProductsForCat);
        } else {
            categoryMap.set(normalizedCatName, {
                ...cat, // Mantém o ID e outras props da primeira ocorrência da categoria
                name: normalizedCatName,
                products: formattedProductsForCat
            });
        }
    });

    const regularCategories = Array.from(categoryMap.values()).filter(c => c.products.length > 0);
    const finalCategories: (Category | {id: string, name: string, products: Product[]})[] = [...regularCategories];

    // 4. Adiciona a aba virtual de "Promoções" no início, se houver produtos promocionais.
    if (promotionalProducts.length > 0) {
      const uniquePromoProducts = Array.from(new Map(promotionalProducts.map(p => [p.id, p])).values());
      finalCategories.unshift({
        id: 'promo-virtual-tab',
        name: '🔥 Promoções',
        products: uniquePromoProducts
      });
    }

    return finalCategories as Category[];
  }, [catalog]);

  useEffect(() => {
    // Roda apenas se as categorias formatadas estiverem prontas e nenhuma categoria estiver selecionada.
    if (formattedCategories.length > 0 && selectedCategory === null) {
      // A lógica de ordenação no useMemo já garante que "Promoção" (se existir) será a primeira.
      // Então, simplesmente selecionamos a primeira categoria da lista formatada.
      setSelectedCategory(formattedCategories[0].id);
    }
  }, [formattedCategories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (!formattedCategories || selectedCategory === null) return [];
    const category = formattedCategories.find(cat => cat.id === selectedCategory);
    return category ? category.products : [];
  }, [formattedCategories, selectedCategory]);

  if (loading && !catalog) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Spinner /></div>;
  if (error) return <NotFound message={error} />;
  if (!catalog) return null;

  const primaryColor = catalog.theme?.primary || '#27272a';
  const backgroundColor = catalog.theme?.background || '#fafaf9';

  return (
    <div className="min-h-screen font-sans transition-colors duration-300 relative overflow-hidden" style={{ backgroundColor }}>
      
      {/* MODAL DE IDENTIFICAÇÃO E FRETE */}
      {isLookupModalOpen && (
        <DeliveryLookupModal 
          isOpen={isLookupModalOpen}
          onClose={() => setIsLookupModalOpen(false)}
          pastOrders={pastOrders}
          companySlug={company_slug!}
          onDeliveryCalculated={handleDeliveryCalculated}
          apiBaseUrl={API_BASE_URL}
        />
      )}

      <div className="w-full bg-white/5 shadow-sm relative z-10">
        <Header 
          name={catalog.name} 
          coverImage={catalog.cover_image} 
          logoUrl={catalog.logo_url} 
          isOpen={catalog.is_open} 
          minOrder={catalog.min_order} // <--- Passando o campo do catálogo
        />
      </div>
      
      {/* BARRINHA DE ENTREGA (SÓ APARECE SE O MODAL FECHOU E JÁ TEM DADOS) */}
      {!isLookupModalOpen && (
        <DeliveryStatusBar 
          isPickup={isPickup} 
          deliveryFee={deliveryFee} 
          customerAddressInfo={customerAddressInfo} 
          onEdit={handleOpenEditModal} 
          theme={catalog.theme} 
        />
      )}
      
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-4 pb-32 animate-fade-in-up gap-5 flex flex-col relative z-10 min-h-screen shadow-2xl shadow-black/5"> 
        {!catalog.is_open && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-center">
            <p className="text-sm font-medium text-red-800">
              Estamos fechados no momento! Você ainda pode ver o cardápio, mas não será possível enviar pedidos.
            </p>
          </div>
        )}
        <div className="sticky top-2 z-30 w-full h-full shadow-sm/30 backdrop-blur-md transition-all border border-stone-200/40 rounded-xl mt-2" style={{ backgroundColor: `${backgroundColor}E6` }}>
          <CategoryCarousel categories={formattedCategories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} theme={catalog.theme} />
        </div>
        <div className="min-h-[50vh] mt-2">
          <ProductList products={filteredProducts} cart={cart} primaryColor={primaryColor} onAddToCart={handleAddToCart} onSubtractFromCart={handleSubtractFromCart} />
        </div>
      </main>

      {/* CARRINHO (AGORA RECEBE TUDO) */}
      <CartDrawer 
        cart={cart} 
        theme={catalog.theme} 
        companySlug={company_slug!} 
        deliveryFee={deliveryFee}
        isPickup={isPickup}
        customerAddressInfo={customerAddressInfo}
        customerName={customerName}
        customerPhone={customerPhone}
        onAddToCart={handleAddToCart}
        onSubtractFromCart={handleSubtractFromCart}
      />
      <PrivacyFooter />
    </div>
  );
};

export default MenuPage;
