import { useEffect } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Logs } from 'lucide-react'; // Escolha o ícone do Lucide que preferir (ex: Utensils, Menu, Store, etc)

export function DynamicFavicon() {
  useEffect(() => {
    // 1. Renderiza o ícone do Lucide para uma string SVG estática
    // Dica: Você pode mudar a cor (stroke) para combinar com a identidade visual da sua aplicação
    const iconMarkup = renderToStaticMarkup(
      <Logs size={25} strokeWidth={2.5} />
    );

    // 2. Converte a string SVG em um Data URI codificado
    const faviconUrl = `data:image/svg+xml;utf8,${encodeURIComponent(iconMarkup)}`;

    // 3. Procura a tag de favicon existente no <head> ou cria uma nova
    let linkTag: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");

    if (!linkTag) {
      linkTag = document.createElement('link');
      linkTag.type = 'image/svg+xml';
      linkTag.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(linkTag);
    }

    // 4. Atualiza o href com o ícone do Lucide convertido
    linkTag.href = faviconUrl;
  }, []);

  return null; // Este componente não renderiza nada visualmente na tela
}