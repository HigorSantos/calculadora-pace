# Graph Report - calculadora-pace  (2026-06-26)

## Corpus Check
- 43 files · ~12,791 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 286 nodes · 624 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ab55412`
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 49 edges
2. `compilerOptions` - 17 edges
3. `PaceByDistanceTimeCalculator()` - 16 edges
4. `TimeByDistancePaceCalculator()` - 16 edges
5. `PaceCalculator()` - 16 edges
6. `DistanceByPaceTimeCalculator()` - 15 edges
7. `formatDisplayDistance()` - 15 edges
8. `useUnitSystem()` - 14 edges
9. `toDisplayPace()` - 12 edges
10. `formatTime()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `DropdownMenuSubTrigger()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuSubContent()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuCheckboxItem()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuSeparator()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  components/ui/dropdown-menu.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (17 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (25): CalculatorShell(), metadata, cn(), metadata, metadata, Badge(), badgeVariants, Card() (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (35): ConsumableManager(), consumableSummaryForUnit(), LapOptionsMenu(), normalizeStrategy(), normalizeTargetMode(), NutritionSummary(), PaceCalculator(), parsePositiveInteger() (+27 more)

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
Nodes (37): CalculatorResultCard(), DistanceByPaceTimeCalculator(), PRESETS, formatDisplayDistanceInput(), formatPresetDistanceInput(), PaceByDistanceTimeCalculator(), presetLabel(), PRESETS (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (30): geistMono, geistSans, metadata, viewport, SiteFooter(), SiteHeader(), tools, Theme (+22 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Já implementado, Muito Próximo, Médio próxima, Roadmap, Sem prazo

### Community 12 - "Community 12"
Cohesion: 0.50
Nodes (3): calculadora-pace, Instructions, When to use

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (5): Core Pattern, Expected Behavior, Implementation Steps, Parametros Config, Project Conventions

## Knowledge Gaps
- **109 isolated node(s):** `metadata`, `metadata`, `metadata`, `geistSans`, `geistMono` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 8`, `Community 1`, `Community 6`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `useUnitSystem()` connect `Community 6` to `Community 8`, `Community 1`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09815078236130868 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07549361207897794 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._