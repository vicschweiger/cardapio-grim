// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import MenuPage from './pages/MenuPage.tsx';
import NotFound from './pages/NotFound.tsx';
import CheckoutForm from './components/CheckoutForm.tsx';
import { CatalogProvider } from './context/CatalogContext.tsx'; // Importado do arquivo correto!
import { DynamicTitle } from './components/DynamicTitle.tsx';
import { DynamicFavicon } from './components/DynamicFavicon.tsx';
import { CookiePreferencesProvider } from './privacy/CookiePreferences.tsx';
import { GtmConsentLoader } from './privacy/GtmConsentLoader.tsx';
import { LegalDocumentPage } from './privacy/LegalDocumentPage.tsx';
import { LegalDocumentsProvider } from './privacy/LegalDocumentsContext.tsx';


function App() {
  return (
    <LegalDocumentsProvider>
      <CookiePreferencesProvider>
        <Router>
          <Routes>
            <Route path="/terms" element={<LegalDocumentPage type="terms" />} />
            <Route path="/privacy" element={<LegalDocumentPage type="privacy" />} />
        
        {/* ROTA PAI: Tudo que começar com /:company_slug será envolvido pelo CatalogProvider.
          O <Outlet /> é onde as páginas filhas (Menu e Checkout) vão aparecer.
        */}
        <Route 
          path="/:company_slug" 
          element={
            <CatalogProvider>
              <DynamicFavicon />
              <DynamicTitle />
              <GtmConsentLoader />
              <Outlet />
            </CatalogProvider>
          } 
        >
          {/* Rota filha 1: A página inicial do cardápio (index) */}
          <Route index element={<MenuPage />} />
          
          {/* Rota filha 2: A página de finalizar o pedido (/checkout) */}
          <Route path="checkout" element={<CheckoutForm />} />
        </Route>

        {/* Rotas genéricas que NÃO precisam do carrinho */}
        <Route path="/" element={<div className="p-10 text-center font-medium">Por favor, acesse o cardápio de um restaurante, ex: /meu-restaurante</div>} />
        <Route path="*" element={<NotFound message="Página não encontrada" />} />
        
          </Routes>
        </Router>
      </CookiePreferencesProvider>
    </LegalDocumentsProvider>
  );
}

export default App;
