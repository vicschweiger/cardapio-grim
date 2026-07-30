// src/components/DynamicTitle.tsx
import { useContext, useEffect } from 'react';
import { CatalogContext } from '../context/CatalogContext.tsx';

export const DynamicTitle: React.FC = () => {
  const context = useContext(CatalogContext);
  const catalog = context?.catalog;

  useEffect(() => {
    // Define o título com o nome que vem do catálogo da API de forma segura
    document.title = catalog?.name 
      ? `Cardápio ${catalog.name}` 
      : "Cardápio | Dashboard";
  }, [catalog]);

  return null;
};