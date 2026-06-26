# Graph Report - calculadora-pace  (2026-06-26)

## Corpus Check
- 36 files · ~10,231 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 236 nodes · 414 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af310a7b`
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
2. `compilerOptions` - 16 edges
3. `formatTime()` - 11 edges
4. `formatPace()` - 11 edges
5. `Calculadora de Pace` - 9 edges
6. `Button()` - 8 edges
7. `PaceCalculator()` - 7 edges
8. `buttonVariants` - 7 edges
9. `parseTime()` - 7 edges
10. `formatDistance()` - 7 edges

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

## Communities (17 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (20): cn(), Badge(), badgeVariants, CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader() (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (23): LapOptionsMenu(), NutritionSummary(), PaceCalculator(), parsePositiveInteger(), Preset, PRESETS, resolveTargetSeconds(), STRATEGIES (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): dependencies, @base-ui/react, class-variance-authority, clsx, lucide-react, next, react, react-dom (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): Acesse a Aplicação, Benefícios, Calculadora de Pace, Calculadora de Pace, Casos de Uso, Contribuições, Funcionalidades, Licença (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (17): CalculatorResultCard(), DistanceByPaceTimeCalculator(), PRESETS, PaceByDistanceTimeCalculator(), PRESETS, PRESETS, TimeByDistancePaceCalculator(), LapRow() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (15): Theme, themes, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuGroup(), DropdownMenuItem(), DropdownMenuLabel() (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (10): geistMono, geistSans, metadata, viewport, SiteFooter(), SiteHeader(), tools, ThemeSelector() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Já implementado, Muito Próximo, Médio próxima, Roadmap, Sem prazo

### Community 12 - "Community 12"
Cohesion: 0.50
Nodes (3): calculadora-pace, Instructions, When to use

### Community 15 - "Community 15"
Cohesion: 0.21
Nodes (5): CalculatorShell(), metadata, metadata, metadata, Card()

## Knowledge Gaps
- **98 isolated node(s):** `metadata`, `metadata`, `metadata`, `geistSans`, `geistMono` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 6`, `Community 7`, `Community 8`, `Community 15`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 8` to `Community 0`, `Community 1`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1032258064516129 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._