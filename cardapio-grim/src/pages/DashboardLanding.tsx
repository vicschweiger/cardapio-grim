import { useEffect } from 'react';
import grimLogo from '../assets/white-logo.png';
import {
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  ChefHat,
  CircleDollarSign,
  CreditCard,
  MapPin,
  MenuSquare,
  MonitorSmartphone,
  PackageCheck,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TimerReset,
  Truck,
  WalletCards,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Gestor de Pedidos | Cardápio online, pedidos e pagamentos';
    const meta = document.querySelector('meta[name="description"]');
    const desc = 'Centralize cardápio, pedidos, cozinha e formas de pagamento com o Gestor de Pedidos. Plano Basic por R$ 130/mês.';
    if (meta) {
      meta.setAttribute('content', desc);
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(79, 70, 229, 0.1); }
          50% { box-shadow: 0 0 22px rgba(79, 70, 229, 0.2); }
        }
      `}</style>

      <header className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-10 top-6 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute right-10 bottom-10 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="grid items-center lg:grid-cols-[1.2fr_0.8fr] gap-10">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-indigo-50 backdrop-blur-sm mb-6">
                <Sparkles className="h-4 w-4" />
                Gestão moderna para restaurantes
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">Seu cardápio, seus pedidos e sua operação em um só lugar.</h1>
              <p className="text-lg sm:text-xl max-w-xl text-indigo-50 mb-7">Receba pedidos online, organize o atendimento e o preparo e ofereça formas de pagamento configuráveis sem depender de um marketplace para administrar seu negócio.</p>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <button onClick={() => navigate('/dashboard#demo')} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-md shadow-lg transition-transform duration-200 hover:-translate-y-0.5">
                  Quero conhecer o Gestor de Pedidos
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/dashboard#howitworks')} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-md border border-white/20 transition hover:bg-white/15">
                  Ver como funciona
                </button>
              </div>

              <div className="mt-6 text-sm text-indigo-100">Plano Basic por R$ 130/mês. Assinatura mensal.</div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-sm" style={{ animation: 'pulseGlow 4s ease-in-out infinite' }}>
                <div className="rounded-2xl bg-white p-4 text-gray-900 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Ponto de Vista</div>
                        <div className="text-xs text-gray-500">Delivery + balcão</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Online</span>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl bg-indigo-50 p-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Pedidos hoje</span>
                        <span className="font-semibold text-indigo-700">18</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-indigo-100">
                        <div className="h-2 w-3/4 rounded-full bg-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-gray-200 p-3" style={{ animation: 'float 5s ease-in-out infinite' }}>
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div className="text-gray-500">Carrinho</div>
                        <div className="font-semibold">12 itens</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-3" style={{ animation: 'float 6s ease-in-out infinite 0.5s' }}>
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                          <ChefHat className="h-4 w-4" />
                        </div>
                        <div className="text-gray-500">Cozinha</div>
                        <div className="font-semibold">7 ativos</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-indigo-700">Pedido #1284</div>
                        <div className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">Em preparo</div>
                      </div>
                      <div className="mt-2 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between"><span>2x Burger</span><span>R$ 74,00</span></div>
                        <div className="flex items-center justify-between"><span>1x Batata</span><span>R$ 18,00</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="problem" className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-8 flex items-center gap-3 text-indigo-600">
          <ShieldCheck className="h-5 w-5" />
          <span className="font-semibold uppercase tracking-[0.12em] text-xs">O problema</span>
        </div>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Quando cada parte da operação está em um lugar, o pedido vira retrabalho.</h2>
            <p className="text-gray-700 text-lg">Cardápio desatualizado, pedidos perdidos, informações incompletas e falta de visibilidade aumentam a pressão sobre a equipe. O Gestor de Pedidos cria um fluxo único para o cliente, o atendimento e a cozinha.</p>
          </div>
          <div className="grid gap-4">
            {[
              { icon: MenuSquare, title: 'Cardápio inconsistente', text: 'Itens sem preço ou informação correta' },
              { icon: BellRing, title: 'Pedidos dispersos', text: 'Alertas e mensagens fora do painel' },
              { icon: TimerReset, title: 'Falta de visibilidade', text: 'Operação sem controle de etapas' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold mb-1">{title}</div>
                  <div className="text-sm text-gray-600">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="howitworks" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Como funciona</div>
            <h2 className="mt-4 text-3xl font-bold">Fluxo simples para a operação</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { icon: Store, title: 'O cliente acessa o cardápio', text: 'Encontra produtos, categorias, promoções e informações da loja.' },
              { icon: ShoppingCart, title: 'Monta e confirma o pedido', text: 'Escolhe entrega ou retirada e uma forma de pagamento disponível.' },
              { icon: BellRing, title: 'A equipe recebe no painel', text: 'O novo pedido aparece com informações para atendimento e preparo.' },
              { icon: PackageCheck, title: 'A operação acompanha o status', text: 'Do novo pedido até a conclusão, cada etapa fica visível.' },
            ].map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-2 hover:shadow-lg" style={{ animation: `float 7s ease-in-out infinite ${index * 0.5}s` }}>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pillars" className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Quatro pilares</div>
          <h2 className="mt-4 text-3xl font-bold">Tudo que seu negócio precisa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { icon: ShoppingCart, title: 'Venda', text: 'Cardápio, carrinho, checkout, cupons, entrega/retirada e pagamentos.' },
            { icon: BellRing, title: 'Operação', text: 'Pedidos centralizados, alertas, status e Kitchen Mode.' },
            { icon: ChartNoAxesCombined, title: 'Gestão', text: 'Produtos, promoções, configurações, histórico e indicadores.' },
            { icon: Rocket, title: 'Crescimento', text: 'Canal próprio e suporte a mensuração por Google Tag Manager.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="catalog" className="bg-gradient-to-b from-indigo-50 to-white py-16">
        <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700 shadow-sm">
              <MenuSquare className="h-4 w-4" />
              Cardápio
            </div>
            <h2 className="mt-4 text-3xl font-bold mb-4">Um cardápio que acompanha o ritmo do negócio.</h2>
            <p className="text-gray-700 text-lg">Cadastre produtos com foto, descrição, categoria e preço. Destaque promoções, pause itens indisponíveis, configure pedido mínimo e controle quando a loja recebe novos pedidos.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: ShoppingCart, title: 'Produtos', text: 'Catálogo dinâmico e organizado' },
              { icon: Sparkles, title: 'Promoções', text: 'Destaque estratégias e campanhas' },
              { icon: Store, title: 'Disponibilidade', text: 'Controle estoque e pausa de itens' },
              { icon: MonitorSmartphone, title: 'Canal próprio', text: 'Cardápio responsivo e sem marketplace' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><Icon className="h-5 w-5" /></div>
                <div className="font-semibold mb-1">{title}</div>
                <div className="text-sm text-gray-600">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="kitchen" className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid lg:grid-cols-[1fr_0.9fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700"><ChefHat className="h-4 w-4" /> Cozinha</div>
            <h2 className="mt-4 text-3xl font-bold mb-4">Do novo pedido ao “pronto”.</h2>
            <p className="text-gray-700 text-lg">Receba alertas, visualize itens e instruções e acompanhe o fluxo operacional. Com o Kitchen Mode habilitado, a equipe organiza pedidos em Novos, Em preparo e Prontos e registra os tempos de produção.</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 shadow-lg">
            <div className="grid gap-3">
              {[
                ['Novos', '03', 'bg-blue-100 text-blue-700'],
                ['Em preparo', '05', 'bg-amber-100 text-amber-700'],
                ['Prontos', '02', 'bg-emerald-100 text-emerald-700'],
              ].map(([label, count, color]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${color}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="delivery" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-2xl bg-indigo-50 p-4">
                <div className="flex items-center gap-3"><Truck className="h-5 w-5 text-indigo-600" /><span className="font-medium">Delivery</span></div>
                <span className="text-sm text-gray-600">Taxa configurável</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-emerald-600" /><span className="font-medium">Retirada</span></div>
                <span className="text-sm text-gray-600">Sem filas</span>
              </div>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700 shadow-sm"><Truck className="h-4 w-4" /> Entrega e retirada</div>
            <h2 className="mt-4 text-3xl font-bold mb-4">Um checkout claro para cada tipo de atendimento.</h2>
            <p className="text-gray-700 text-lg">O cliente pode escolher delivery ou retirada no balcão. Para entrega, o sistema busca o endereço por CEP, calcula a taxa conforme a configuração do estabelecimento e valida a área atendida.</p>
          </div>
        </div>
      </section>

      <section id="payments" className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700"><CreditCard className="h-4 w-4" /> Pagamentos</div>
        </div>
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Configure as formas de pagamento da sua operação.</h2>
            <p className="text-gray-700 text-lg">Disponibilize dinheiro ou cartão na entrega, PIX manual e integração com Mercado Pago. Na integração, o cliente conclui o pagamento no ambiente do Mercado Pago conectado ao estabelecimento.</p>
            <div className="mt-6 text-sm text-gray-500">Métodos sujeitos à configuração. Taxas, análise e condições do Mercado Pago são definidas pelo provedor.</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: WalletCards, title: 'Dinheiro', text: 'Pagamento no recebimento' },
              { icon: CreditCard, title: 'Cartão', text: 'Entrega ou balcão' },
              { icon: CircleDollarSign, title: 'PIX', text: 'Manual ou via integração' },
              { icon: ShieldCheck, title: 'Mercado Pago', text: 'Fluxo seguro e integrado' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><Icon className="h-5 w-5" /></div>
                <div className="font-semibold mb-1">{title}</div>
                <div className="text-sm text-gray-600">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plan" className="bg-gradient-to-r from-indigo-50 to-violet-50 py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700 shadow-sm"><Rocket className="h-4 w-4" /> Plano</div>
          <h2 className="mt-4 text-3xl font-bold mb-4">Gestor de Pedidos — Basic</h2>
          <div className="text-5xl font-extrabold text-indigo-700 mb-3">R$ 130<span className="text-lg align-top text-gray-500">/mês</span></div>
          <p className="text-gray-700 text-lg max-w-3xl mx-auto mb-5">Uma assinatura mensal para acessar o software e os recursos contratados enquanto o plano estiver ativo. Sem compra ou transferência do código-fonte. Cobrança recorrente mensal. Todos os módulos atuais do catálogo incluídos. Sem taxa de implantação e sem fidelidade. Cancelamento interrompe cobranças futuras e mantém o acesso até o fim do período já pago. Recursos e melhorias adicionados gradativamente.</p>
          <button onClick={() => navigate('/dashboard#demo')} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold shadow-lg transition-transform duration-200 hover:-translate-y-0.5">
            Quero uma demonstração
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section id="evolution" className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700"><Rocket className="h-4 w-4" /> Evolução contínua</div>
          <h2 className="mt-4 text-3xl font-bold mb-4">Um produto que continua evoluindo.</h2>
          <p className="text-gray-700 text-lg">Novos recursos, integrações e melhorias são adicionados gradativamente. O Gestor de Pedidos comunica cada recurso conforme sua disponibilidade: disponível, em implantação ou planejado.</p>
        </div>
      </section>

      <section id="faq" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">FAQ</div>
            <h2 className="mt-4 text-3xl font-bold">Perguntas frequentes</h2>
          </div>

          <dl className="space-y-4">
            {[
              ['O que é o Gestor de Pedidos?', 'É uma plataforma por assinatura que reúne cardápio online, pedidos, operação e formas de pagamento configuráveis.'],
              ['Quanto custa?', 'O plano disponível atualmente é o Basic, por R$ 130 por mês.'],
              ['A mensalidade compra o sistema?', 'Não. A mensalidade concede acesso ao software enquanto a assinatura estiver ativa, conforme os Termos de Adesão e Uso.'],
              ['O Mercado Pago está incluído?', 'O Gestor de Pedidos oferece integração. O estabelecimento precisa conectar uma conta habilitada, e taxas, análise e condições são definidas pelo Mercado Pago.'],
              ['Posso receber por PIX?', 'Sim, conforme a configuração: PIX manual por chave ou PIX disponibilizado pelo Mercado Pago conectado.'],
              ['O cliente pode retirar no balcão?', 'Sim. O checkout permite escolher entrega ou retirada.'],
              ['Consigo organizar os pedidos da cozinha?', 'Sim, quando o Kitchen Mode estiver habilitado para o estabelecimento.'],
              ['Há fidelidade ou taxa de implantação?', 'Não. O Basic não possui taxa de implantação, prazo mínimo de fidelidade ou multa de cancelamento.'],
              ['Como cancelo?', 'O cancelamento pode ser solicitado a qualquer momento. A cobrança recorrente é cancelada, não há novas mensalidades e o acesso permanece até o fim do período já pago. Valores já pagos não são devolvidos proporcionalmente, ressalvados os direitos previstos em lei.'],
              ['Novos recursos serão adicionados?', 'Sim. A plataforma evolui gradativamente, sem promessa de data para recursos ainda não disponibilizados.'],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <dt className="font-semibold mb-2">{question}</dt>
                <dd className="text-gray-600">{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="final-cta" className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-50"><Sparkles className="h-4 w-4" /> Demonstração</div>
          <h3 className="mt-4 text-3xl font-bold mb-4">Veja o Gestor de Pedidos funcionando com um pedido real.</h3>
          <p className="text-lg text-indigo-100 mb-6">Agende uma demonstração e descubra como centralizar cardápio, pedidos e operação.</p>
          <button onClick={() => navigate('/dashboard#demo')} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-md font-semibold shadow-lg transition-transform duration-200 hover:-translate-y-0.5">
            Quero conhecer o Gestor de Pedidos
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white b-0 py-8">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="https://grimdev.com.br" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors">
            <img src={grimLogo} alt="Grim Developments" className="h-10 w-auto object-contain" />
            <span className="font-semibold tracking-wide">Grim Developments</span>
          </a>

          <div className="text-sm text-slate-300 text-center md:text-right">
            <div>
              <a href="https://grimdev.com.br" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                grimdev.com.br
              </a>
            </div>
            <div>Desenvolvido por Grim Developments © 2026</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
