// src/components/CategoryCarousel.tsx
import type { Category, ThemeColors } from '../types/index.tsx';

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number) => void;
  theme: ThemeColors;
}

const CategoryCarousel = ({ categories, selectedCategory, onSelectCategory, theme }: CategoryCarouselProps) => {
  // Só renderiza o carrossel se houver categorias para exibir.
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="py-4 overflow-x-auto px-5">
      <div className="flex space-x-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-gray-200 text-gray-800'
                : 'text-black'
            }`}
            style={{
              backgroundColor: selectedCategory === category.id ? theme.primary : undefined,
              color: selectedCategory === category.id ? theme.text : undefined,
            }}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryCarousel;
