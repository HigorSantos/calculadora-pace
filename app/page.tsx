import { SportShoeIcon} from "lucide-react";
import {PaceCalculator} from "@/components/pace-calculator";

export default function Page() {
	return (
		<main id='calculadora-pace' className='scroll-mt-24 bg-background'>
			<div className='mx-auto w-full max-w-5xl px-4 py-8 sm:py-12'>
				<header className='mb-10'>
					<h1 className='mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl'>
						Estratégia de Corrida
					</h1>
					<p className='mt-2 max-w-2xl text-muted-foreground text-pretty'>
						Defina sua distância e tempo alvo para ver o ritmo ideal trecho a
						trecho. Ajuste qualquer parcial e deixe o plano se adaptar
						automaticamente.
					</p>

					<div className='mt-5 flex max-w-3xl items-start gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm sm:items-center sm:p-4'>
						<span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:mt-0'>
							<SportShoeIcon className='size-4' />
						</span>
						<div className='space-y-1'>
							<p className='font-semibold text-foreground'>
								Monte sua estratégia completa enquanto o Premium está aberto
							</p>
							<p className='text-muted-foreground'>
								Monte sua estratégia completa e teste ações, ritmo e nutrição
								sem limites enquanto a oferta de lançamento está ativa.
							</p>
						</div>
					</div>
				</header>

				<PaceCalculator />
			</div>
		</main>
	);
}
