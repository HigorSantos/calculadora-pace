# Graph Report - calculadora-pace  (2026-07-02)

## Corpus Check
- 80 files · ~25,569 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 480 nodes · 1168 edges · 27 communities (21 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12c85591`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `PaceCalculator()` - 21 edges
3. `useUnitSystem()` - 17 edges
4. `compilerOptions` - 17 edges
5. `PaceByDistanceTimeCalculator()` - 16 edges
6. `TimeByDistancePaceCalculator()` - 16 edges
7. `Button()` - 16 edges
8. `formatDisplayDistance()` - 16 edges
9. `DistanceByPaceTimeCalculator()` - 15 edges
10. `formatTime()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `activateCustomer()`  [EXTRACTED]
  app/api/admin/activate/route.ts → lib/customer.ts
- `AuthMenuAction()` --calls--> `cn()`  [EXTRACTED]
  components/auth-menu-action.tsx → lib/utils.ts
- `CalculatorShell()` --calls--> `cn()`  [EXTRACTED]
  components/calculators/calculator-shell.tsx → lib/utils.ts
- `presetLabel()` --calls--> `formatDisplayDistance()`  [EXTRACTED]
  components/calculators/pace-by-distance-time-calculator.tsx → lib/units.ts
- `presetLabel()` --calls--> `formatDisplayDistance()`  [EXTRACTED]
  components/calculators/time-by-distance-pace-calculator.tsx → lib/units.ts

## Import Cycles
- None detected.

## Communities (27 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (20): ConsumiveisPorMarca, ConsumivelCatalogItem, applyLapEdit(), BRANDED_CONSUMABLES, buildDistances(), buildEqualLaps(), buildLaps(), buildLapsFromInitialPace() (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.24
Nodes (4): CalculatorShell(), metadata, metadata, metadata

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (33): dependencies, @base-ui/react, class-variance-authority, clsx, lucide-react, mongodb, next, react (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): Acesse a Aplicação, Benefícios, Calculadora de Pace, Calculadora de Pace, Casos de Uso, Contribuições, Funcionalidades, Licença (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (43): CalculatorResultCard(), DistanceByPaceTimeCalculator(), PRESETS, formatDisplayDistanceInput(), formatPresetDistanceInput(), PaceByDistanceTimeCalculator(), presetLabel(), PRESETS (+35 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (15): LapDivisionConfig, PaceHistorySnapshot, PaceHistoryState, PaceQueryValues, StoredPaceHistory, Consumable, Strategy, SuppressedRow() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Já implementado, Muito Próximo, Médio próxima, Roadmap, Sem prazo

### Community 12 - "Community 12"
Cohesion: 0.50
Nodes (3): calculadora-pace, Instructions, When to use

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (5): Core Pattern, Expected Behavior, Implementation Steps, Parametros Config, Project Conventions

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (14): geistMono, ManropeSans, metadata, viewport, BillingAccessContext, BillingAccessContextValue, BillingAccessProvider(), SiteFooter() (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (15): API Routes, Ativar um cliente manualmente, Camadas, Consumíveis, Cookie, Histórico, Identificar um cliente existente (setar cookie), Identificação de clientes (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): Ações por plano, Consumíveis personalizados, Histórico, Limites de ações e consumíveis

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (59): POST(), clearAuthCookies(), findAuth0Customer(), GET(), redirectToRegistrar(), setCustomerCookie(), POST(), centsValue() (+51 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (29): AuthMenuAction(), AuthMenuActionProps, AuthMenuDropdownSection(), accessModes, BillingAccessMockSelector(), useBillingAccess(), iconsByName, MobileHeaderMenu() (+21 more)

### Community 23 - "Community 23"
Cohesion: 0.07
Nodes (42): cn(), LapBlock, LapBlockHeader(), LapBlockHeaderProps, LapDivisionBoundary(), LapDivisionBoundaryProps, StatCard(), premiumBenefits (+34 more)

### Community 24 - "Community 24"
Cohesion: 0.26
Nodes (11): canAddCustomConsumable(), canAddFreePlanDivision(), canAddPlanAction(), ConsumableIdentifier, countActionsWithinLaps(), countCustomConsumables(), LapActions, limitFreeRedoHistory() (+3 more)

### Community 25 - "Community 25"
Cohesion: 0.38
Nodes (6): perHour(), formatDisplayMass(), massUnitLabel(), toDisplayMass(), NutritionSummary(), consumableSummaryForUnit()

### Community 26 - "Community 26"
Cohesion: 0.47
Nodes (6): defaultLapDivisions(), isPaceHistorySnapshot(), isPaceQueryValues(), isRecord(), normalizeLapDivisions(), parseStoredPaceHistory()

## Knowledge Gaps
- **150 isolated node(s):** `PREMIUM_ITEM`, `InfinitePayWebhookPayload`, `metadata`, `metadata`, `metadata` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 23` to `Community 8`, `Community 1`, `Community 22`, `Community 6`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 22` to `Community 8`, `Community 6`, `Community 23`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `useBillingAccess()` connect `Community 22` to `Community 8`, `Community 17`, `Community 6`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `PREMIUM_ITEM`, `InfinitePayWebhookPayload`, `metadata` to the rest of the system?**
  _150 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._