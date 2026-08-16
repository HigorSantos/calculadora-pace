# Graph Report - calculadora-pace  (2026-08-01)

## Corpus Check
- 93 files · ~35,516 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 572 nodes · 1440 edges · 30 communities (23 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd7a718c`
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
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `PaceCalculator()` - 25 edges
3. `Button()` - 17 edges
4. `useUnitSystem()` - 17 edges
5. `compilerOptions` - 17 edges
6. `PaceByDistanceTimeCalculator()` - 16 edges
7. `TimeByDistancePaceCalculator()` - 16 edges
8. `formatDisplayDistance()` - 16 edges
9. `DistanceByPaceTimeCalculator()` - 15 edges
10. `formatTime()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `DialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dialog.tsx → lib/utils.ts
- `POST()` --calls--> `activateCustomer()`  [EXTRACTED]
  app/api/admin/activate/route.ts → lib/customer.ts
- `CalculatorShell()` --calls--> `cn()`  [EXTRACTED]
  components/calculators/calculator-shell.tsx → lib/utils.ts
- `presetLabel()` --calls--> `formatDisplayDistance()`  [EXTRACTED]
  components/calculators/pace-by-distance-time-calculator.tsx → lib/units.ts
- `presetLabel()` --calls--> `formatDisplayDistance()`  [EXTRACTED]
  components/calculators/time-by-distance-pace-calculator.tsx → lib/units.ts

## Import Cycles
- None detected.

## Communities (30 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (21): ConsumiveisPorMarca, ConsumivelCatalogItem, applyLapEdit(), BRANDED_CONSUMABLES, buildEqualLaps(), buildLaps(), buildLapsFromDistances(), buildLapsFromInitialPace() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (27): buildDistances(), isUnitSystem(), defaultLapDivisions(), isPaceHistorySnapshot(), isPaceQueryValues(), isRecord(), normalizeLapDivisions(), parseStoredPaceHistory() (+19 more)

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
Cohesion: 0.14
Nodes (45): CalculatorResultCard(), DistanceByPaceTimeCalculator(), PRESETS, formatDisplayDistanceInput(), formatPresetDistanceInput(), PaceByDistanceTimeCalculator(), presetLabel(), PRESETS (+37 more)

### Community 8 - "Community 8"
Cohesion: 0.26
Nodes (11): canAddCustomConsumable(), canAddFreePlanDivision(), canAddPlanAction(), ConsumableIdentifier, countActionsWithinLaps(), countCustomConsumables(), LapActions, limitFreeRedoHistory() (+3 more)

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
Cohesion: 0.15
Nodes (15): geistMono, ManropeSans, metadata, viewport, BillingAccessContext, BillingAccessContextValue, BillingAccessProvider(), PREMIUM_ANUAL_PLAN (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (15): API Routes, Ativar um cliente manualmente, Camadas, Consumíveis, Cookie, Histórico, Identificar um cliente existente (setar cookie), Identificação de clientes (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): Ações por plano, Consumíveis personalizados, Histórico, Limites de ações e consumíveis

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (68): POST(), clearAuthCookies(), findAuth0Customer(), GET(), redirectToRegistrar(), setCustomerCookie(), POST(), centsValue() (+60 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (53): AuthMenuAction(), AuthMenuActionProps, AuthMenuDropdownSection(), accessModes, BillingAccessMockSelector(), useBillingAccess(), iconsByName, MobileHeaderMenu() (+45 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (17): buildRaceActions(), findLapIndexForDistance(), formatRaceDate(), formatRaceDistance(), isRaceConfigurationVisible(), RACE_CONFIGURATIONS, raceActionConsumableId(), raceActionDescription() (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (6): CalculatorShell(), metadata, StatCard(), metadata, metadata, Card()

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (21): DEFAULT_EXPORT_OPTIONS, Lap, isRaceConsumableId(), areHistorySnapshotsEqual(), arePaceQueryValuesEqual(), buildLapDistanceRanges(), buildLapDivisionSummaries(), cloneHistoryValue() (+13 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (23): premiumBenefits, PremiumUpgradePage(), AnalyticsParams, useUmami(), Window, LapBlock, LapBlockHeader(), LapBlockHeaderProps (+15 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (15): Consumable, Strategy, ExportedConsumable, ExportedLapAction, ImportDialogState, LapDivisionSummaries, PaceCalculatorExport, PaceHistoryState (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.28
Nodes (7): PaceCalculator(), parseTime(), fromDisplayPace(), formatImportDateTime(), normalizeStrategy(), normalizeTargetMode(), resolveTargetSeconds()

## Knowledge Gaps
- **161 isolated node(s):** `PREMIUM_ITEM`, `InfinitePayWebhookPayload`, `metadata`, `metadata`, `metadata` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 22` to `Community 6`, `Community 8`, `Community 24`, `Community 26`, `Community 27`, `Community 29`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `useUmami()` connect `Community 27` to `Community 26`, `Community 29`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 22` to `Community 8`, `Community 26`, `Community 27`, `Community 6`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `PREMIUM_ITEM`, `InfinitePayWebhookPayload`, `metadata` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._