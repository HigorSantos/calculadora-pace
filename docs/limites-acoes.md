# Limites de ações e consumíveis

Os limites de ações do plano e de consumíveis adicionados pelo usuário ficam centralizados em `lib/action-limits.ts` para ajuste e reutilização fora do `pace-calculator`. Essas funções descrevem o limite do plano grátis; liberações pagas devem ser verificadas pela camada de acesso em `lib/billing-access.ts`.

## Ações por plano

- O limite é calculado pela quantidade de trechos do plano.
- Até 10 trechos: 1 ação.
- A partir daí, cada nova faixa iniciada de 10 trechos libera mais 1 ação.
- Exemplos:
  - 5 trechos: 1 ação.
  - 10 trechos: 1 ação.
  - 11 trechos: 2 ações.
  - 20 trechos: 2 ações.
  - 21 trechos: 3 ações.
  - 35 trechos: 4 ações.

Use as funções puras:

```ts
maxActionsForLapCount(lapCount)
countActionsWithinLaps(actions, lapCount)
canAddPlanAction(actions, lapCount)
```

## Consumíveis personalizados

- O limite atual é de 1 item genérico adicionado pelo usuário.
- Itens personalizados são identificados pelo prefixo `custom-`.
- O ajuste deve ser feito pela constante `CUSTOM_CONSUMABLE_LIMIT`.

Use as funções puras:

```ts
countCustomConsumables(consumables)
canAddCustomConsumable(consumables)
```

## Histórico

- O plano grátis mantém 2 ações de desfazer e 2 ações de refazer.
- O modo pago ignora esse limite por meio da feature `unlimited-history`.
- Os limites são definidos por `FREE_HISTORY_UNDO_LIMIT` e `FREE_HISTORY_REDO_LIMIT`.
- O fallback em `localStorage` deve persistir o histórico já respeitando esses limites para usuários grátis.

Use as funções puras:

```ts
limitFreeUndoHistory(items)
limitFreeRedoHistory(items)
```

Não recalcule esses limites diretamente dentro de componentes.
