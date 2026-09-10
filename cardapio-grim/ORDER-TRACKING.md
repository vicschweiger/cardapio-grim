# Acompanhamento público de pedidos

## Arquitetura verificada antes das alterações

- O cardápio usa React/Vite e React Router. `App.tsx` envolve `/:company_slug` e `/checkout` em `CatalogProvider`; o parâmetro chamado slug é o token público usado nas chamadas da API.
- `CheckoutForm` reexporta `CheckoutPage`, que orquestra dinheiro/cartão na entrega, PIX manual e Mercado Pago. Os três caminhos possuem componentes de resultado próprios.
- A API Django mantém `Order` relacional e uma projeção Mongo em `orders`. A criação tradicional grava primeiro no Mongo e tenta sincronizar SQL; há suporte a pedidos existentes apenas no Mongo. Mercado Pago e kitchen usam o model relacional, cujo `save()` sincroniza o Mongo.
- Campos reutilizados: `customer_phone`, `order_number`, `company`/`company_id`, `Company.access_token`, `status`, `created_at`, `preparation_started_at` e `ready_at`. `total_amount` e `is_pickup` são apresentados como `total` e `order_type` apenas no novo retorno público; os campos existentes não foram renomeados.
- Os status existentes são `new`, `preparing`, `ready`, `dispatched`, `completed` e `canceled`. A leitura aceita também o legado `cancelled` sem criar um status novo.
- `order_number` já é uma senha pública amigável, gerada automaticamente pelos checkouts. A sequência existente reinicia após 10.000 e não é um identificador histórico único. Ela foi preservada; não há endpoint individual nem exposição de ID como alternativa para registros antigos sem senha.
- Não há WebSocket/SSE nesses fluxos. O projeto já usa polling e DRF `SimpleRateThrottle`.

## Comportamento implementado

`GET /api/public/orders/track/?company_token=TOKEN_DA_EMPRESA&phone=11999999999`

Retorna sempre uma lista, do mais recente para o mais antigo, contendo somente:

```json
[
  {
    "order_number": "1042",
    "created_at": "2026-09-10T12:00:00+00:00",
    "updated_at": "2026-09-10T12:05:00+00:00",
    "status": "preparing",
    "status_label": "Em preparo",
    "order_type": "delivery",
    "items": [
      {"name": "Hambúrguer", "quantity": "2", "unit_price": "25.00", "line_total": "50.00", "notes": null}
    ],
    "subtotal": "50.00",
    "delivery_fee": "10.00",
    "service_fee": "2.00",
    "discount_amount": "3.10",
    "coupon_code": "BEMVINDO",
    "total": "58.90",
    "payment_method": "money",
    "payment_method_label": "Dinheiro na entrega",
    "payment_status": "pending",
    "payment_status_label": "Pagamento pendente",
    "is_paid": false,
    "paid_at": null,
    "change_for": "100.00",
    "refund_status": "none",
    "refund_status_label": "Sem estorno",
    "refund_amount": "0.00",
    "refunded_at": null,
    "delivery_address": "Rua Exemplo, 10"
  }
]
```

Empresa e telefone são obrigatórios. O filtro Mongo combina ambos, com correspondência integral do telefone, incluindo formatação legada. A normalização remove formatação e o código 55 apenas quando o comprimento indica código de país, preservando DDD 55. Não há busca global pelo telefone.

A resposta usa lista explícita de campos públicos e monta um resumo financeiro com itens, subtotal, frete, taxa de serviço, desconto inferido, cupom, total, forma e situação do pagamento, troco e estorno. Não expõe `payment_details`, IDs internos ou identificadores do provedor. Usa `Cache-Control: no-store` e limite de 12 consultas por minuto/IP pelo mecanismo DRF existente. `400` indica parâmetros inválidos, `404` empresa desconhecida, `429` limite excedido e `503` indisponibilidade do Mongo. Telefone sem pedidos recebe `200` e `[]`. O rate limit herda o alcance do cache já configurado na instalação.

A página é `/:company_slug/pedidos`. Exibe número, data/hora em São Paulo, total, modalidade, status e timeline. Retirada usa “Liberado para retirada”; cancelados têm destaque próprio. Atualiza a cada 20 segundos após a resposta anterior, sem requisições sobrepostas. Interrompe ao desmontar, trocar a busca, receber lista vazia ou ter apenas pedidos finalizados/cancelados. Falhas transitórias são informadas e permitem nova atualização; `400`, `404` e `429` interrompem tentativas automáticas.

Dinheiro/cartão e PIX passam o telefone pelo state de navegação; ele não é adicionado ao endereço da página nem a um novo armazenamento local. A consulta GET envia o telefone à API conforme o contrato solicitado. No retorno externo do Mercado Pago o usuário informa o celular novamente. As ações de pagamento foram preservadas.

## Migration

Foi criada `business/migrations/0044_order_updated_at.py` para `Order.updated_at`. Preenche pedidos SQL antigos com a última data conhecida entre criação, início do preparo e pronto. As próximas gravações sincronizam o campo no Mongo; registros Mongo antigos usam essas datas como alternativa de leitura. Não há como reconstruir horários históricos de transições que nunca foram registrados.

Aplicar no ambiente escolhido antes de executar a versão nova da API:

```powershell
.\venv\Scripts\python.exe manage.py migrate
```

A migration foi exercitada no banco de testes e conferida com `makemigrations --check --dry-run`. Não foi aplicada ao banco operacional nesta tarefa.

## Todos os arquivos criados ou modificados

Caminhos do backend relativos a `api-grimdev`:

| Arquivo | Alteração |
| --- | --- |
| `business/views/public_orders.py` | Endpoint público, normalização, projeção segura, labels, ordenação, cache e throttle. |
| `core/urls.py` | Registro do novo endpoint. |
| `business/models/order.py` | Data de atualização e sincronização Mongo, inclusive em `save(update_fields=...)`. |
| `business/views/orders.py` | Gravação de `updated_at` na criação Mongo e nas atualizações diretas que não passam por `save()`. |
| `business/migrations/0044_order_updated_at.py` | Campo e preenchimento das datas antigas. |
| `business/tests/test_public_order_tracking.py` | Contrato público, isolamento, formatos, cancelamento, kitchen/painel, legado, indisponibilidade, migration e limite. |

Caminhos do frontend relativos a `cardapio-grim/cardapio-grim`:

| Arquivo | Alteração |
| --- | --- |
| `src/App.tsx` | Rota `pedidos`. |
| `src/api/checkout.ts` | Cliente da consulta pública, sem cache e com AbortSignal. |
| `src/orders/tracking.ts` | Tipos, normalização, timeline e ciclo de polling cancelável. |
| `src/pages/OrderTrackingPage.tsx` | Formulário, resultados e timeline acessível. |
| `src/pages/MenuPage.tsx` | Link de acompanhamento no cardápio. |
| `src/pages/CheckoutPage.tsx` | Preserva e passa o número público retornado e o telefone em memória. |
| `src/components/checkout/TrackOrderLink.tsx` | Link compartilhado de navegação com state. |
| `src/components/checkout/CheckoutSuccessState.tsx` | Mensagem com senha pública e botão de acompanhamento. |
| `src/components/checkout/CheckoutPixState.tsx` | Senha pública e acompanhamento, preservando QR Code e declaração de pagamento. |
| `src/components/checkout/MercadoPagoReturnState.tsx` | Senha pública e acompanhamento após aprovação, preservando consulta do pagamento. |
| `src/types/checkout.ts` | Tipagem opcional do `order_number` que a API já retorna. |
| `tests/orderTracking.test.ts` | Normalização, contrato da chamada, timeline, temporização, término, erro e limpeza. |
| `package.json` | Inclui os novos testes no comando existente, sem alterar dependências. |
| `ORDER-TRACKING.md` | Este relatório e roteiro de validação. |

## Verificação

- Backend: 56 testes de acompanhamento inicial, kitchen, model e cancelamento aprovados; conjunto ampliado de acompanhamento e Mercado Pago com 24 aprovados; 16 testes PIX aprovados. Na verificação final, os 14 testes de acompanhamento passaram, incluindo o caso de fuso das datas legadas. Esses conjuntos se sobrepõem: são 87 testes distintos aprovados ao longo da verificação.
- Frontend: 18 testes aprovados; TypeScript, lint e build de produção concluídos. Lint tem avisos em arquivos não alterados; Vite avisa sobre tamanho do bundle.
- `git diff --check` e conferência de migrations aprovados.
- Nos testes da API, SQL é real e a fronteira Mongo é simulada com filtro avaliado e gravações de sincronização capturadas; não foi usado um Mongo de produção.
- Não havia navegador disponível na sessão. A aparência e o fluxo completo no navegador ainda precisam da validação manual abaixo.

## Teste manual

1. Aplicar a migration em desenvolvimento, iniciar a API e iniciar o Vite com a configuração habitual apontando para essa API.
2. Abrir `/<TOKEN_DA_EMPRESA>`, concluir um pedido com celular conhecido e conferir a senha pública na tela de sucesso. Clicar em “Acompanhar pedido”: o telefone deve vir preenchido nos fluxos locais e permanecer ausente do endereço da página.
3. Abrir diretamente `/<TOKEN_DA_EMPRESA>/pedidos` e buscar o mesmo telefone, inclusive com `+55`, parênteses e hífen. Conferir os mesmos pedidos, mais recentes primeiro.
4. Buscar outro telefone e usar o token de outra empresa: não devem aparecer os pedidos do primeiro cliente/estabelecimento.
5. No kitchen, iniciar e finalizar o preparo. Na página pública, verificar `Em preparo` e `Pronto` após a próxima consulta. No painel, liberar/despachar e finalizar; conferir os mesmos estados.
6. Repetir com retirada: a timeline deve dizer “Liberado para retirada”, sem etapa de entrega. Cancelar um pedido e conferir “Pedido cancelado”.
7. No DevTools, verificar que o retorno contém apenas os campos documentados. Ele inclui o endereço do pedido e a identificação não sensível da forma de pagamento, mas não inclui telefone, nome, IDs internos, estado financeiro nem detalhes do provedor. Conferir a parada das consultas quando todos estão encerrados e ao sair da página.
8. Testar telefone sem pedidos, falha de rede e tentativas acima do limite. A tela deve mostrar mensagens e permitir nova busca; `429` interrompe o polling.
9. Conferir PIX e retorno de Mercado Pago aprovado: os recursos atuais de pagamento devem continuar funcionando e o acompanhamento deve estar acessível.

Nenhum commit, push, deploy, alteração de `.env`, dependência ou configuração de módulos foi realizado.
