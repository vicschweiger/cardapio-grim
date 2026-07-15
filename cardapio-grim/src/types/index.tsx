// src/types/index.ts
export interface Product {
  id: number;
  name: string;
  description: string;
  price: string; // ou number, dependendo da sua API
  image_url: string;
}

export interface Category {
  id: number;
  name: string;
  products: Product[];
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface CatalogData {
  name: string;
  cover_image: string;
  is_open: boolean;
  theme: ThemeColors;
  categories: Category[];
}

// Para o carrinho
export interface CartItem extends Product {
  quantity: number;
}
  