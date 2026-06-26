import {Footprints} from "lucide-react";
import {PaceCalculator} from "@/components/pace-calculator";

export default function Page() {
	return (
		<main id='calculadora-pace' className='scroll-mt-24 bg-background'>
			<div className='mx-auto w-full max-w-5xl px-4 py-8 sm:py-12'>
				<header className='mb-10'>
					<div className='flex items-center gap-2 text-primary'>
						<Footprints className='size-5' />
						<span className='text-sm font-semibold uppercase tracking-wide'>
							Ferramenta atual
						</span>
					</div>
					<h1 className='mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl'>
						Estratégia de Corrida
					</h1>
					<p className='mt-2 max-w-2xl text-muted-foreground text-pretty'>
						Defina sua distância e tempo alvo para ver o ritmo ideal quilômetro
						a quilômetro. Ajuste qualquer trecho e deixe o plano se adaptar
						automaticamente.
					</p>
				</header>

				<PaceCalculator />
			</div>
		</main>
	);
}
