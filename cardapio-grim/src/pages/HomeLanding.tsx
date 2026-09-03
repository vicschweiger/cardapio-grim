import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomeLanding() {
  const [slug, setSlug] = useState('');
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = slug.trim().replace(/^\/+/, '');
    if (!cleaned) return;
    navigate(`/${cleaned}`);
  };

  const goExample = (example: string) => {
    navigate(`/${example}`);
  };

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <section className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 mb-6 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A4.5 4.5 0 017.5 3h9A4.5 4.5 0 0121 7.5v9a4.5 4.5 0 01-4.5 4.5h-9A4.5 4.5 0 013 16.5v-9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h6" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Bem-vindo ao Cardápio</h1>
        <p className="text-gray-600 mb-6">Parece que você está na página inicial. Para ver um cardápio, acesse o endereço do restaurante (slug). Exemplo: /meu-restaurante</p>

        <form onSubmit={submit} className="flex items-center gap-2 justify-center mb-6">
          <label htmlFor="slug" className="sr-only">Slug do restaurante</label>
          <input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Digite o slug do restaurante (ex: meu-restaurante)"
            className="w-full max-w-md px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Slug do restaurante"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Abrir</button>
        </form>

        <div className="text-sm text-gray-600 mb-4">Sugestões rápidas</div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => goExample('meu-restaurante')} className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200">/meu-restaurante</button>
          <button onClick={() => goExample('pizzaria')} className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200">/pizzaria</button>
          <button onClick={() => goExample('salgados')} className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200">/salgados</button>
        </div>

        <p className="text-xs text-gray-500 mt-6">Se você é dono de um restaurante e quer que seu cardápio apareça aqui, compartilhe o slug correto com seus clientes.</p>
      </section>
    </main>
  );
}
