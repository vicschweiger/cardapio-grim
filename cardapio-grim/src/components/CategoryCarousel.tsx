import type { Category, ThemeColors } from '../types/index.tsx';

interface CategoryCarouselProps {
  categories: Category[];
  selectedCategory: number | string | null;
  onSelectCategory: (id: number | string) => void;
  theme: ThemeColors;
}

const CategoryCarousel = ({ categories, selectedCategory, onSelectCategory, theme }: CategoryCarouselProps) => {
  if (!categories?.length) return null;

  return (
    <nav aria-label="Categorias do cardápio" className="overflow-x-auto px-2 py-2.5 sm:px-3">
      <div className="flex gap-1.5">
        {categories.map(category => {
          const isSelected = selectedCategory === category.id;
          return (
            <button
              type="button"
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              aria-current={isSelected ? 'page' : undefined}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-black/10 ${isSelected ? 'shadow-sm' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950'}`}
              style={isSelected ? { backgroundColor: theme.primary, color: theme.text } : undefined}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CategoryCarousel;
