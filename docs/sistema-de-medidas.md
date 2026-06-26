# Sistema de medidas

O Arsenal do Corredor usa uma seleção global de sistema de medidas:

- `metric`: padrão quando não houver preferência salva.
- `imperial`: alternativa escolhida pelo usuário.

A escolha fica persistida em `localStorage` pela chave `arsenal-unit-system` e é exposta pelo `UnitSystemProvider`.

## Regra de implementação

Ferramentas devem manter os cálculos internos nas unidades canônicas do projeto:

- distância: quilômetros;
- pace: segundos por quilômetro;
- velocidade: quilômetros por hora;
- carboidrato: gramas;
- sódio e cafeína: miligramas.

A interface deve converter entrada e saída usando `lib/units.ts` e `useUnitSystem()`:

- parse de distância: `parseDisplayDistance`;
- exibição de distância: `formatDisplayDistance`;
- conversão de pace: `fromDisplayPace` e `toDisplayPace`;
- exibição de pace: `formatDisplayPace`;
- exibição de velocidade: `formatDisplaySpeed`;
- exibição de massa: `formatDisplayMass`;
- labels: `distanceUnitLabel`, `paceUnitLabel` e `speedUnitLabel`.

Não coloque `km`, `/km`, `km/h`, `g` ou `mg` diretamente em componentes de ferramenta quando o valor puder mudar com o sistema de medidas.
