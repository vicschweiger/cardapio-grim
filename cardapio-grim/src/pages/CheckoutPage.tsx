// src/pages/CheckoutPage.tsx
import { useLocation, useParams, Navigate, Link } from 'react-router-dom';
import CheckoutForm from '../components/CheckoutForm.tsx';

const CheckoutPage = () => {
  const location = useLocation();
  const { company_slug } = useParams<{ company_slug: string }>();

  // Dados passados da página do menu através do `navigate` state
  const { cart, theme } = location.state || {};

  // Se o usuário chegar aqui diretamente sem um carrinho, redireciona de volta ao menu
  if (!cart || cart.length === 0 || !theme || !company_slug) {
    return <Navigate to={`/${company_slug || ''}`} replace />;
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: theme.background, color: theme.text }}>
      <header className="max-w-lg mx-auto mb-8">
        <Link to={`/${company_slug}`} className="text-sm hover:underline" style={{color: theme.primary}}>&larr; Voltar para o cardápio</Link>
        <h1 className="text-3xl font-bold mt-2">Finalizar Pedido</h1>
        <p className="text-lg opacity-80">Confira seus dados e finalize a compra.</p>
      </header>
      <main className="max-w-lg mx-auto">
        <CheckoutForm cart={cart} theme={theme} companySlug={company_slug} />
      </main>
    </div>
  );
};

export default CheckoutPage;