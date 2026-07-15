// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPage from './pages/MenuPage.tsx';
import NotFoundPage from './pages/NotFound.tsx';
import CheckoutPage from './pages/CheckoutPage.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:company_slug" element={<MenuPage />} />
        <Route path="/:company_slug/checkout" element={<CheckoutPage />} />
        {/* Você pode adicionar uma página inicial ou de fallback aqui */}
        <Route path="/" element={<div>Por favor, acesse o cardápio de um restaurante, ex: /meu-restaurante</div>} />
        <Route path="*" element={<NotFoundPage message="Página não encontrada" />} />
      </Routes>
    </Router>
  );
}

export default App;
