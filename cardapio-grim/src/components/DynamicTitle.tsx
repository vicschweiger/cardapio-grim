// src/components/DynamicTitle.tsx
import { useContext, useEffect } from 'react';
import { CatalogContext } from '../context/CatalogContext.tsx';

export const DynamicTitle: React.FC = () => {
  const { catalog } = useContext(CatalogContext); // Alterado para 'catalog'

  useEffect(() => {
    // Define o título com o nome que vem do catálogo da API
    document.title = catalog?.name 
      ? `Cardápio ${catalog.name}` 
      : "Cardápio | Dashboard";
  }, [catalog]);

  return null;
};