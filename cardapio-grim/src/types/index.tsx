export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  image_url: string;
}

export interface Category {
  id: number;
  name: string;
  products: Product[];
}

export interface Theme {
  background: string;
}

export interface CatalogData {
  name: string;
  is_open: boolean;
  cover_image: string;
  theme: Theme;
  logo_url?: string;
  categories: Category[];
}

export interface CartItem extends Product {
  quantity: number;
}