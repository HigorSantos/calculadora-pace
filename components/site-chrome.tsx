import Link from "next/link";
import {Activity, Dumbbell, Gauge, Route, Timer} from "lucide-react";
import {ThemeSelector} from "@/components/theme-selector";
import {UnitSystemSelector} from "@/components/unit-system-selector";
import {Separator} from "@base-ui/react";

const tools = [
	{
		label: "Estratégia de Corrida",
		shortLabel: null,
		href: "/#estrategia-corrida",
		status: null,
		icon: Timer,
		destaque: true,
	},
	{
		label: "Tempo por distância e pace",
		shortLabel: "Est. Tempo",
		href: "/calculadoras/tempo-por-distancia-e-pace",
		status: null,
		icon: Activity,
		destaque: false,
	},
	{
		label: "Pace por distância e tempo",
		shortLabel: "Est. Pace",
		href: "/calculadoras/pace-por-distancia-e-tempo",
		status: null,
		icon: Gauge,
		destaque: false,
	},
	{
		label: "Distância por pace e tempo",
		shortLabel: "Est. Distância",
		href: "/calculadoras/distancia-por-pace-e-tempo",
		status: null,
		icon: Route,
		destaque: false,
	},
];

function BrandMark() {
	return (
		<Link
			href='/'
			className='group flex min-w-0 items-center gap-3'
			aria-label='Arsenal do Corredor'
		>
			<span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-transform group-hover:-translate-y-0.5'>
				<Dumbbell className='size-5' />
			</span>
			<span className='min-w-0'>
				<span className='block truncate text-base font-bold tracking-tight'>
					Arsenal do Corredor
				</span>
				<span className='block truncate text-xs font-medium text-muted-foreground'>
					Ferramentas para correr melhor
				</span>
			</span>
		</Link>
	);
}

export function SiteHeader() {
	return (
		<header className='sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80'>
			<div className='mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-0'>
				<BrandMark />

				<div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
					<nav
						aria-label='Ferramentas'
						className='flex flex-wrap items-center gap-1 text-sm font-medium'
					>
						{tools.map(tool => (
							<Link
								key={tool.label}
								href={tool.href}
								className='inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted'
								title={tool.label}
							>
								<tool.icon
									className={`size-4 ${tool.destaque ? "text-primary" : ""}`}
								/>
								{tool.shortLabel ? tool.shortLabel : tool.label}
							</Link>
						))}
					</nav>

					<div className='flex items-center gap-2'>
						<ThemeSelector />
						<UnitSystemSelector />
					</div>
				</div>
			</div>
		</header>
	);
}

export function SiteFooter() {
	return (
		<footer className='border-t border-border bg-muted/35'>
			<div className='mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]'>
				<div className='space-y-3'>
					<BrandMark />
					<p className='max-w-md text-sm leading-6 text-muted-foreground'>
						Um arsenal simples e objetivo para planejar ritmo, treinos e provas
						com mais clareza.
					</p>
					<a
						href='https://arsenaldocorredor.com.br/'
						className='inline-flex text-sm font-medium text-primary hover:underline'
					>
						arsenaldocorredor.com.br
					</a>
				</div>

				<div>
					<h2 className='text-sm font-semibold'>Ferramentas</h2>
					<ul className='mt-3 space-y-2 text-sm text-muted-foreground'>
						{tools.map(tool => (
							<li key={tool.label} className='flex items-center gap-2'>
								{tool.href === "#" ? (
									<span>{tool.label}</span>
								) : (
									<a href={tool.href} className='hover:text-foreground'>
										{tool.label}
									</a>
								)}
								{tool.status && (
									<span className='rounded-md bg-background px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground'>
										{tool.status}
									</span>
								)}
							</li>
						))}
					</ul>
				</div>

				<div>
					<h2 className='text-sm font-semibold'>Projeto</h2>
					<p className='mt-3 text-sm leading-6 text-muted-foreground'>
						Construído para corredores que querem trocar improviso por plano,
						sem transformar a rotina em planilha infinita.
					</p>
				</div>
			</div>
		</footer>
	);
}
