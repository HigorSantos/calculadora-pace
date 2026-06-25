"use client"

import { useMemo, useState } from "react"
import { Plus, RotateCcw, Timer, Trash2, Utensils, X } from "lucide-react"
import {
  applyLapEdit,
  buildLaps,
  computeNutrition,
  consumableSummary,
  DEFAULT_CONSUMABLES,
  DEFAULT_SPREAD,
  formatPace,
  formatTime,
  parseTime,
  perHour,
  type Consumable,
  type Lap,
  type Strategy,
} from "@/lib/pace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STRATEGIES: { value: Strategy; label: string; hint: string }[] = [
  {
    value: "constant",
    label: "Split constante",
    hint: "Mesmo ritmo em todos os quilômetros.",
  },
  {
    value: "negative",
    label: "Split negativo",
    hint: "Começa mais lento e termina mais rápido.",
  },
  {
    value: "positive",
    label: "Split positivo",
    hint: "Começa mais rápido e termina mais lento.",
  },
]

type Preset = { label: string; distance: number; time: string }

const PRESETS: Preset[] = [
  { label: "5 km", distance: 5, time: "25:00" },
  { label: "10 km", distance: 10, time: "50:00" },
  { label: "21,1 km", distance: 21.1, time: "1:45:00" },
  { label: "42,2 km", distance: 42.2, time: "3:45:00" },
]

export function PaceCalculator() {
  const [distance, setDistance] = useState(5)
  const [distanceInput, setDistanceInput] = useState("5")
  const [targetInput, setTargetInput] = useState("25:00")
  const [recalc, setRecalc] = useState(true)
  const [strategy, setStrategy] = useState<Strategy>("constant")
  // Variação máxima de pace entre início e fim, em % do pace médio.
  const [spreadPct, setSpreadPct] = useState(DEFAULT_SPREAD * 100)
  const [spreadInput, setSpreadInput] = useState(String(DEFAULT_SPREAD * 100))
  const [laps, setLaps] = useState<Lap[]>(() =>
    buildLaps(5, 25 * 60, "constant", DEFAULT_SPREAD),
  )

  const targetSeconds = parseTime(targetInput) ?? 0

  const totalTime = useMemo(() => laps.reduce((a, l) => a + l.time, 0), [laps])
  const totalDistance = useMemo(
    () => laps.reduce((a, l) => a + l.distance, 0),
    [laps],
  )
  const diff = totalTime - targetSeconds
  const avgPace = totalDistance > 0 ? totalTime / totalDistance : 0

  function regenerate(
    nextDistance: number,
    nextTargetInput: string,
    nextStrategy: Strategy = strategy,
    nextSpreadPct: number = spreadPct,
  ) {
    const secs = parseTime(nextTargetInput)
    if (!nextDistance || nextDistance <= 0 || secs == null || secs <= 0) {
      setLaps([])
      return
    }
    setLaps(buildLaps(nextDistance, secs, nextStrategy, nextSpreadPct / 100))
  }

  function handleDistanceChange(value: string) {
    setDistanceInput(value)
    const parsed = Number(value.replace(",", "."))
    if (!Number.isNaN(parsed)) {
      setDistance(parsed)
      regenerate(parsed, targetInput)
    }
  }

  function handleTargetChange(value: string) {
    setTargetInput(value)
    regenerate(distance, value)
  }

  function handleStrategyChange(value: Strategy) {
    setStrategy(value)
    regenerate(distance, targetInput, value)
  }

  function applySpread(pct: number) {
    if (typeof pct !== "number" || Number.isNaN(pct)) return
    const clamped = Math.min(50, Math.max(0, pct))
    setSpreadPct(clamped)
    setSpreadInput(String(clamped))
    regenerate(distance, targetInput, strategy, clamped)
  }

  function handleSpreadInputChange(value: string) {
    setSpreadInput(value)
    const parsed = Number(value.replace(",", "."))
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(50, Math.max(0, parsed))
      setSpreadPct(clamped)
      regenerate(distance, targetInput, strategy, clamped)
    }
  }

  function applyPreset(preset: Preset) {
    setDistance(preset.distance)
    setDistanceInput(String(preset.distance).replace(".", ","))
    setTargetInput(preset.time)
    regenerate(preset.distance, preset.time)
  }

  function commitLap(index: number, raw: string) {
    const secs = parseTime(raw)
    if (secs == null) return
    setLaps((prev) => applyLapEdit(prev, index, secs, targetSeconds, recalc))
  }

  function reset() {
    regenerate(distance, targetInput)
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
      {/* Painel de configuração */}
      <Card className="h-fit p-6 lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold">Configuração</h2>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Informe a distância e o tempo alvo. O ritmo é dividido igualmente
          entre os quilômetros.
        </p>
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Distâncias rápidas
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="distance">Distância (km)</Label>
            <Input
              id="distance"
              inputMode="decimal"
              value={distanceInput}
              onChange={(e) => handleDistanceChange(e.target.value)}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Tempo alvo (mm:ss ou h:mm:ss)</Label>
            <Input
              id="target"
              value={targetInput}
              onChange={(e) => handleTargetChange(e.target.value)}
              placeholder="25:00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Estratégia</Label>
            <Select value={strategy} onValueChange={handleStrategyChange}>
              <SelectTrigger id="strategy" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground text-pretty">
              {STRATEGIES.find((s) => s.value === strategy)?.hint}
            </p>
          </div>

          <div
            className={`space-y-3 ${strategy === "constant" ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="spread">Variação máxima de pace</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="spread"
                  inputMode="decimal"
                  value={spreadInput}
                  onChange={(e) => handleSpreadInputChange(e.target.value)}
                  onBlur={() => setSpreadInput(String(spreadPct))}
                  disabled={strategy === "constant"}
                  className="h-8 w-16 text-center font-mono tabular-nums"
                  aria-label="Variação máxima de pace em porcentagem"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <Slider
              value={[spreadPct]}
              onValueChange={(v) => applySpread(Array.isArray(v) ? v[0] : v)}
              min={0}
              max={30}
              step={0.5}
              disabled={strategy === "constant"}
              aria-label="Variação máxima de pace"
            />
            <p className="text-xs text-muted-foreground text-pretty">
              Diferença de ritmo entre o início e o fim da prova. Quanto maior, mais
              acentuada a aceleração ou desaceleração.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <Label htmlFor="recalc" className="cursor-pointer">
                Recalcular trechos seguintes
              </Label>
              <p className="text-xs text-muted-foreground text-pretty">
                Ao editar um trecho, ajusta os seguintes para manter o tempo
                alvo. Desmarcado, apenas o trecho editado muda.
              </p>
            </div>
            <Switch id="recalc" checked={recalc} onCheckedChange={setRecalc} />
          </div>

          <Button
            variant="ghost"
            onClick={reset}
            className="w-full gap-2"
            disabled={laps.length === 0}
          >
            <RotateCcw className="size-4" />
            Redividir trechos
          </Button>
        </div>
      </Card>

      {/* Resultado */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:h-[calc(100svh-3rem)]">
        <div className="grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Tempo total" value={formatTime(totalTime)} />
          <StatCard
            label="Pace médio"
            value={avgPace > 0 ? formatPace(avgPace) : "--"}
          />
          <StatCard
            label="Diferença do alvo"
            value={
              diff === 0
                ? "no alvo"
                : `${diff > 0 ? "+" : "-"}${formatTime(Math.abs(diff))}`
            }
            tone={diff === 0 ? "ok" : diff > 0 ? "over" : "under"}
            className="col-span-2 sm:col-span-1"
          />
        </div>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-4">
            <Timer className="size-4 text-primary" />
            <h2 className="font-semibold">Trecho a trecho</h2>
            <span className="ml-auto text-sm text-muted-foreground">
              {laps.length} {laps.length === 1 ? "trecho" : "trechos"}
            </span>
          </div>

          {laps.length === 0 ? (
            <p className="flex-1 px-5 py-10 text-center text-sm text-muted-foreground">
              Informe uma distância e um tempo alvo válidos para ver o plano.
            </p>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {laps.map((lap, index) => (
                <LapRow
                  key={index}
                  index={index}
                  lap={lap}
                  cumulative={laps
                    .slice(0, index + 1)
                    .reduce((a, l) => a + l.time, 0)}
                  onCommit={(raw) => commitLap(index, raw)}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = "neutral",
  className = "",
}: {
  label: string
  value: string
  tone?: "neutral" | "ok" | "over" | "under"
  className?: string
}) {
  const toneClass =
    tone === "over"
      ? "text-destructive"
      : tone === "under"
        ? "text-primary"
        : "text-foreground"
  return (
    <Card className={`gap-1 p-4 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`font-mono text-xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </span>
    </Card>
  )
}

function LapRow({
  index,
  lap,
  cumulative,
  onCommit,
}: {
  index: number
  lap: Lap
  cumulative: number
  onCommit: (raw: string) => void
}) {
  const display = formatTime(lap.time)
  const isPartial = lap.distance < 1
  const pace = lap.distance > 0 ? lap.time / lap.distance : 0

  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary tabular-nums">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-medium">
          {isPartial
            ? `Trecho final (${lap.distance.toLocaleString("pt-BR")} km)`
            : `Quilômetro ${index + 1}`}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatPace(pace)} · acumulado {formatTime(cumulative)}
        </div>
      </div>

      <Input
        key={display}
        id={`lap-${index}`}
        defaultValue={display}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
        }}
        className="w-24 text-center font-mono tabular-nums"
        aria-label={`Tempo do quilômetro ${index + 1}`}
      />
    </li>
  )
}
