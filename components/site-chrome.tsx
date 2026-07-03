import Link from "next/link";
import {Activity, Gauge, Route, SportShoeIcon, Timer} from "lucide-react";
import {AuthMenuAction} from "@/components/auth-menu-action";
import {BillingAccessMockSelector} from "@/components/billing-access-mock-selector";
import {MobileHeaderMenu} from "@/components/mobile-header-menu";
import {ThemeSelector} from "@/components/theme-selector";
import {UnitSystemSelector} from "@/components/unit-system-selector";

const tools = [
	{
		label: "Estratégia de Corrida",
		shortLabel: null,
		href: "/#estrategia-corrida",
		status: null,
		icon: Timer,
		iconName: "timer",
		destaque: true,
	},
	{
		label: "Tempo por distância e pace",
		shortLabel: "Est. Tempo",
		href: "/calculadoras/tempo-por-distancia-e-pace",
		status: null,
		icon: Activity,
		iconName: "activity",
		destaque: false,
	},
	{
		label: "Pace por distância e tempo",
		shortLabel: "Est. Pace",
		href: "/calculadoras/pace-por-distancia-e-tempo",
		status: null,
		icon: Gauge,
		iconName: "gauge",
		destaque: false,
	},
	{
		label: "Distância por pace e tempo",
		shortLabel: "Est. Distância",
		href: "/calculadoras/distancia-por-pace-e-tempo",
		status: null,
		icon: Route,
		iconName: "route",
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
			<span className='flex flex-col upp gap-0 min-w-0 text-xl sm:text-2xl text-center'>
				<span className='text-black font-light text-lg sm:text-xl dark:text-white text-left'>
					Arsenal do
				</span>
				<span className='text-primary font-bold -mt-2 whitespace-nowrap'>
					Corredor{" "}
					<SportShoeIcon className='inline size-5 -mt-1.5 sm:size-6 transform -scale-x-100' />
				</span>
			</span>
		</Link>
	);
}

export function SiteHeader() {
	const primaryTool = tools.find(tool => tool.destaque) ?? tools[0];
	const secondaryTools = tools.filter(tool => tool !== primaryTool);
	const mobileTools = secondaryTools.map(({label, href, iconName}) => ({
		label,
		href,
		iconName,
	}));

	return (
		<header className=' top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80'>
			<div className='mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-0'>
				<BrandMark />

				<div className='flex items-center gap-2 lg:gap-3'>
					<nav
						aria-label='Ferramentas'
						className='flex items-center gap-1 text-sm font-medium'
					>
						<Link
							href={primaryTool.href}
							className='inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted'
							title={primaryTool.label}
						>
							<primaryTool.icon className='size-4 text-primary' />
							<span className='inline whitespace-nowrap'>
								{primaryTool.label}
							</span>
						</Link>
						{secondaryTools.map(tool => (
							<Link
								key={tool.label}
								href={tool.href}
								className='hidden h-8 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-muted lg:inline-flex'
								title={tool.label}
							>
								<tool.icon className='size-4' />
								{tool.shortLabel ? tool.shortLabel : tool.label}
							</Link>
						))}
					</nav>

					<div className='hidden items-center gap-2 lg:flex'>
						{process.env.NODE_ENV === "development" && (
							<BillingAccessMockSelector />
						)}
						<ThemeSelector />
						<UnitSystemSelector />
						<AuthMenuAction variant='button' />
					</div>
					<MobileHeaderMenu tools={mobileTools} />
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
					<Link
						href='/politica-de-privacidade'
						className='mt-3 inline-flex text-sm font-medium text-primary hover:underline'
					>
						Política de privacidade
					</Link>
				</div>
			</div>
			<div className='mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6'>
				<p className='text-xs text-muted-foreground'>
					Todos os nomes de marcas, logotipos e marcas comerciais mencionados
					neste site, como Z2, Pace It, Dobro®, pertencem aos seus respectivos
					donos. O site Arsenal do Corredor não possui associação, afiliação ou
					endosso destas marcas.
				</p>
			</div>
		</footer>
	);
}
