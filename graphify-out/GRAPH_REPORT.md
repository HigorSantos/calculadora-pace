# Graph Report - calculadora-pace  (2026-06-27)

## Corpus Check
- 61 files · ~18,071 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 367 nodes · 882 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d6ec759d`
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 59 edges
2. `PaceCalculator()` - 19 edges
3. `useUnitSystem()` - 17 edges
4. `compilerOptions` - 17 edges
5. `PaceByDistanceTimeCalculator()` - 16 edges
6. `TimeByDistancePaceCalculator()` - 16 edges
7. `formatDisplayDistance()` - 16 edges
8. `DistanceByPaceTimeCalculator()` - 15 edges
9. `Button()` - 14 edges
10. `toDisplayPace()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `presetLabel()` --calls--> `formatDisplayDistance()`  [EXTRACTED]
  components/calculators/pace-by-distance-time-calculator.tsx → lib/units.ts
- `presetLabel()` --calls--> `formatDisplayDistance()`  [EXTRACTED]
  components/calculators/time-by-distance-pace-calculator.tsx → lib/units.ts
- `LapOptionsMenu()` --calls--> `cn()`  [EXTRACTED]
  components/pace-calculator-parts/lap-options-menu.tsx → lib/utils.ts
- `LapRow()` --calls--> `cn()`  [EXTRACTED]
  components/pace-calculator-parts/lap-row.tsx → lib/utils.ts
- `consumableSummaryForUnit()` --calls--> `formatDisplayMass()`  [EXTRACTED]
  components/pace-calculator-parts/utils.ts → lib/units.ts

## Import Cycles
- None detected.

## Communities (21 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (39): CalculatorShell(), metadata, cn(), StatCard(), UpgradeDialog(), metadata, metadata, Badge() (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (32): isPaceHistorySnapshot(), isPaceQueryValues(), isRecord(), PaceHistorySnapshot, PaceHistoryState, PaceQueryValues, parseStoredPaceHistory(), StoredPaceHistory (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (32): dependencies, @base-ui/react, class-variance-authority, clsx, lucide-react, next, react, react-dom (+24 more)

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
Cohesion: 0.18
Nodes (39): CalculatorResultCard(), DistanceByPaceTimeCalculator(), PRESETS, formatDisplayDistanceInput(), formatPresetDistanceInput(), PaceByDistanceTimeCalculator(), presetLabel(), PRESETS (+31 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (26): accessModes, BillingAccessMockSelector(), useBillingAccess(), SiteFooter(), tools, Theme, themes, ThemeSelector() (+18 more)

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
Cohesion: 0.12
Nodes (18): geistMono, ManropeSans, metadata, viewport, BillingAccessContext, BillingAccessContextValue, BillingAccessProvider(), SiteHeader() (+10 more)

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): Camadas, Consumíveis, Histórico, Regra de implementação, Área paga

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): Ações por plano, Consumíveis personalizados, Histórico, Limites de ações e consumíveis

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (18): ConsumiveisPorMarca, ConsumivelCatalogItem, applyLapEdit(), BRANDED_CONSUMABLES, buildDistances(), buildEqualLaps(), buildLaps(), buildLapsFromInitialPace() (+10 more)

## Knowledge Gaps
- **125 isolated node(s):** `metadata`, `metadata`, `metadata`, `ManropeSans`, `geistMono` (+120 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 8`, `Community 1`, `Community 6`, `Community 17`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 8` to `Community 0`, `Community 1`, `Community 6`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `useUnitSystem()` connect `Community 6` to `Community 8`, `Community 1`, `Community 17`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _125 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08080808080808081 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._