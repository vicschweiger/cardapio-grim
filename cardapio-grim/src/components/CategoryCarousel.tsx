// src/components/CategoryCarousel.tsx
import type { Category, ThemeColors } from '../types/index.tsx';

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number) => void;
  theme: ThemeColors;
}

const CategoryCarousel = ({ categories, selectedCategory, onSelectCategory, theme }: CategoryCarouselProps) => (
  <div className="py-4 overflow-x-auto">
    <div className="flex space-x-3">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === category.id
              ? 'text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
          style={{ 
            backgroundColor: selectedCategory === category.id ? theme.primary : undefined,
            color: selectedCategory === category.id ? theme.text : undefined
          }}
        >
          {category.name}
        </button>
      ))}
    </div>
  </div>
);

export default CategoryCarousel;
