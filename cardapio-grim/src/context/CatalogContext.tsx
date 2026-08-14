import { createContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CatalogData, Product, CartItem } from '../types/index.tsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://web-production-6e1d8.up.railway.app/api';

export interface CatalogContextProps {
  catalog: CatalogData | null;
  loading: boolean;
  error: string | null;
  cart: CartItem[];
  fetchCatalog: (slug: string, silent?: boolean) => Promise<void>;
  handleAddToCart: (product: Product) => void;
  handleSubtractFromCart: (productId: string | number) => void;
  removeFromCart: (itemName: string) => void;
  clearCart: () => void;
}

export const CatalogContext = createContext<CatalogContextProps | null>(null);

export const CatalogProvider = ({ children }: { children: ReactNode }) => {
  const [catalogData, setCatalogData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);

  // Fetch store catalog (with silent mode to prevent UI flickering)
  const fetchCatalog = useCallback(async (slug: string, silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    setCurrentSlug(slug);

    try {
      const response = await fetch(`${API_BASE_URL}/catalog/${slug}/`);
      if (response.status === 404) {
        throw new Error('Restaurante não encontrado.');
      }
      if (!response.ok) {
        throw new Error('Ocorreu um erro ao buscar o cardápio.');
      }
      const data: CatalogData = await response.json();
      setCatalogData(data);
    } catch (err: any) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // REAL-TIME RADAR: Silently updates store data every 15 seconds
  useEffect(() => {
    if (!currentSlug) return;
    const interval = setInterval(() => {
      fetchCatalog(currentSlug, true); 
    }, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [currentSlug, fetchCatalog]);

  // A lógica de formatação e ordenação de categorias foi centralizada na MenuPage.
  const catalog = catalogData;

  // Add item to global cart
  const handleAddToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  }, []);

  // Remove item from global cart
  const handleSubtractFromCart = useCallback((productId: string | number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (!existingItem) return prevCart;

      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const removeFromCart = useCallback((itemName: string) => {
    setCart(previousCart => previousCart.filter(item => item.name !== itemName));
  }, []);

  return (
    <CatalogContext.Provider
      value={{
        catalog,
        loading,
        error,
        cart,
        fetchCatalog,
        handleAddToCart,
        handleSubtractFromCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};
