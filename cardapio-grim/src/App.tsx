// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import MenuPage from './pages/MenuPage.tsx';
import NotFound from './pages/NotFound.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import { CatalogProvider } from './context/CatalogContext.tsx'; // Importado do arquivo correto!

function App() {
  return (
    <Router>
      <Routes>
        
        {/* ROTA PAI: Tudo que começar com /:company_slug será envolvido pelo CatalogProvider.
          O <Outlet /> é onde as páginas filhas (Menu e Checkout) vão aparecer.
        */}
        <Route 
          path="/:company_slug" 
          element={
            <CatalogProvider>
              <Outlet />
            </CatalogProvider>
          } 
        >
          {/* Rota filha 1: A página inicial do cardápio (index) */}
          <Route index element={<MenuPage />} />
          
          {/* Rota filha 2: A página de finalizar o pedido (/checkout) */}
          <Route path="checkout" element={<CheckoutPage />} />
        </Route>

        {/* Rotas genéricas que NÃO precisam do carrinho */}
        <Route path="/" element={<div className="p-10 text-center font-medium">Por favor, acesse o cardápio de um restaurante, ex: /meu-restaurante</div>} />
        <Route path="*" element={<NotFound message="Página não encontrada" />} />
        
      </Routes>
    </Router>
  );
}

export default App;