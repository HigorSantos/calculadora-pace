# Área paga

Funcionalidades exclusivas devem depender da camada de acesso global, não de uma origem específica de dados.

## Camadas

- Regras puras: `lib/billing-access.ts`
- Estado client/global: `components/billing-access-provider.tsx`
- Mock temporário (apenas dev): `components/billing-access-mock-selector.tsx`
- Domínio de clientes: `lib/customer.ts`
- Cliente MongoDB: `lib/mongodb.ts`
- Helpers de cookie: `lib/customer-cookie.ts`

## Identificação de clientes

Cada cliente pago tem um `customerId` (UUID) único gerado uma vez e armazenado no MongoDB (coleção `customers`). Esse ID é a fonte da verdade do acesso — independente da plataforma de pagamento.

### Modelo (`Customer`)

```ts
{
  customerId: string;           // UUID único
  name: string | null;
  active: boolean;
  createdAt: Date;
  activatedAt: Date | null;
  identifiers: [                // múltiplos identificadores por cliente
    {
      type:
        | "email"
        | "hotmart_id"
        | "stripe_id"
        | "auth0_user_id"
        | "infinite_pay_order_nsu"
        | "manual";
      value: string;
    }
  ];
  paymentPlatform: string | null;   // ex: "hotmart", "stripe", "infinite-pay"
  paymentMethod: "pix" | "credit_card" | "boleto" | "other" | null;
  amountPaidCents: number | null;   // valor em centavos
  installments: number | null;
  orderNsu: string | null;
  transactionNsu: string | null;
}
```

### Cookie

O `customerId` é persistido no cookie httpOnly `arsenal-cid`.

Regra de vencimento (`lib/customer-cookie.ts`):
- **Menos de 10 dias** desde `activatedAt`: maxAge de 1 dia (revalida diariamente)
- **10 dias ou mais**: maxAge de 1 ano, acompanhando a validade anual da assinatura

## API Routes

| Rota | Descrição |
|---|---|
| `GET /api/auth/me` | Lê o cookie, retorna `{ active: boolean }` e renova o cookie |
| `POST /api/auth/identify` | Body: `{ type, value }` — resolve identificador e seta o cookie |
| `GET /api/auth/login` | Inicia login Auth0. Com `order_nsu`, mantém o fluxo de registro pós-pagamento; sem `order_nsu`, retorna para `/` e identifica o cliente por Auth0/email |
| `GET /api/auth/logout` | Remove cookies locais e redireciona para o logout do Auth0 com retorno para `/` |
| `GET /auth/callback` | Recebe callback Auth0, vincula a conta ao cliente pago e seta o cookie |
| `POST /api/admin/activate` | Ativa cliente manualmente (requer `x-admin-secret`) |
| `POST /api/checkout/infinite-pay/start` | Cria/reutiliza cliente pendente e gera `orderNsu` interno |
| `POST /api/webhooks/infinite-pay` | Recebe confirmação de pagamento da InfinitePay |

### Ativar um cliente manualmente

```bash
curl -X POST https://arsenaldocorredor.com.br/api/admin/activate \
  -H "x-admin-secret: <ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "identifierType": "email",
    "identifierValue": "joao@example.com",
    "paymentPlatform": "hotmart",
    "paymentMethod": "pix",
    "amountPaidCents": 4990
  }'
```

Resposta: `{ customerId, active: true }`

### Iniciar checkout InfinitePay (backend interno)

Rota: `POST /api/checkout/infinite-pay/start`

Body:

```json
{ "name": "João Silva", "email": "joao@example.com" }
```

Regras atuais:

- Normaliza o nome e o e-mail antes de chamar o parceiro.
- Grava o cliente pendente no Mongo com `name`, identificador `email` e `orderNsu` antes de chamar a InfinitePay.
- Reutiliza cliente existente pelo identificador `{ type: "email", value: email }`, quando houver.
- Gera e persiste `orderNsu` quando o cliente ainda não tiver um.
- Persiste também o identificador `{ type: "infinite_pay_order_nsu", value: orderNsu }`.
- Mantém o cliente pendente (`active: false`) até o webhook confirmar o pagamento.
- Chama a API de links da InfinitePay somente depois que o cliente pendente foi salvo.

Resposta:

```json
{
  "url": "https://...",
  "customerId": "...",
  "orderNsu": "..."
}
```

### Webhook InfinitePay

Rota: `POST /api/webhooks/infinite-pay`

Documentação oficial: https://www.infinitepay.io/checkout-documentacao

Campos usados do payload aprovado:

```ts
{
  paid_amount: number | string;
  installments: number | string;
  capture_method?: string;
  order_nsu: string;
  transaction_nsu: string;
}
```

Regras atuais:

- `order_nsu` é usado para reconciliar um cliente pendente criado por `/api/checkout/infinite-pay/start`.
- `paymentPlatform` é salvo como `"infinite-pay"`.
- `capture_method` é convertido para `paymentMethod` (`pix`, `boleto`, `credit_card` ou `other`).
- `paid_amount` é salvo em `amountPaidCents` como valor em centavos.
- `installments`, `order_nsu` e `transaction_nsu` são persistidos no cliente.
- Após ativar o cliente, o webhook busca o identificador `email` salvo no cliente pendente e cria o usuário na Auth0 via Management API.
- Se a Auth0 retornar conflito de usuário já existente, o webhook continua idempotente e responde sucesso.
- Quando a Auth0 retorna `user_id`, ele é salvo como identificador `{ type: "auth0_user_id", value: user_id }`.
- Se não existir cliente pendente com esse `order_nsu`, o fluxo ainda cria um cliente ativo de fallback com o identificador InfinitePay, mas não consegue criar usuário Auth0 por falta de email.
- Payload inválido retorna `400` para permitir retry do provedor.
- Payload válido retorna `200` com `{ received: true }`.

### Registro após pagamento

Fluxo planejado para o redirect do checkout InfinitePay:

1. O provedor redireciona o cliente para `/registrar` com os parâmetros de retorno, incluindo `order_nsu`.
2. A página `/registrar` busca o cliente por `orderNsu`.
3. Se o pagamento ainda não foi confirmado pelo webhook, a página informa que a confirmação está em andamento.
4. Se o cliente estiver ativo, o CTA aponta para `/api/auth/login?order_nsu=...`.
5. A rota `/api/auth/login?order_nsu=...` valida novamente o pagamento ativo antes de enviar o usuário ao Auth0.
6. O callback `/auth/callback` troca o `code` por token, busca o perfil no Auth0, vincula `{ type: "auth0_user_id", value: sub }` ao cliente e seta o cookie `arsenal-cid`.
7. O login sem `order_nsu` também usa Auth0, identifica o cliente por `auth0_user_id` ou email e retorna para `/`.

Parâmetros esperados no retorno da InfinitePay:

```ts
{
  order_nsu?: string;
  transaction_nsu?: string;
  slug?: string;
  capture_method?: string;
  receipt_url?: string;
}
```

O redirect do pagamento não libera acesso sozinho. A liberação depende do webhook ativar o cliente no banco.

### Identificar um cliente existente (setar cookie)

```bash
curl -X POST https://arsenaldocorredor.com.br/api/auth/identify \
  -H "Content-Type: application/json" \
  -d '{ "type": "email", "value": "joao@example.com" }'
```

## Regra de implementação

Use `useBillingAccess()` em componentes client — sem mudança:

```tsx
const {canAccess} = useBillingAccess();
const canUseFeature = canAccess("multiple-actions-per-lap");
```

O `BillingAccessProvider` em produção consulta `GET /api/auth/me` no mount.
Em desenvolvimento, o mock do localStorage tem prioridade e o `BillingAccessMockSelector` aparece no header.

## Variáveis de ambiente necessárias

```
MONGODB_URI=...
ADMIN_SECRET=...   # secret para a rota /api/admin/activate
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=...
AUTH0_DATABASE_CONNECTION=Username-Password-Authentication
NEXT_PUBLIC_AUTH_MENU_ENABLED=true  # habilita Entrar/Sair no menu mobile
```

No Auth0, configure a URL base do site em **Allowed Logout URLs**, porque `/api/auth/logout` redireciona para `/v2/logout?returnTo=<origem>/`.

## Consumíveis

`Consumable.paid` indica que o item só deve aparecer para usuários com acesso pago.

## Histórico

A quantidade de desfazer/refazer é controlada pela feature `unlimited-history`. Usuários grátis mantêm somente 2 retornos e 2 avanços; usuários pagos mantêm histórico ilimitado.
