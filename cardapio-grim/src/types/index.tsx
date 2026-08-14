export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  image_url: string;
  category_id?: number;
  is_active?: boolean;
  is_promotional?: boolean;
  original_price?: string | null;
}

export interface Category {
  id: number;
  name: string;
  products: Product[];
}

export interface Theme {
  background: string;
  primary: string;
  text: string;
}

export type ThemeColors = Theme;

export interface CatalogData {
  name: string;
  is_open: boolean;
  cover_image: string;
  theme: Theme;
  logo_url?: string;
  categories: Category[];
  min_order?: number;
  mercadopago_enabled?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
