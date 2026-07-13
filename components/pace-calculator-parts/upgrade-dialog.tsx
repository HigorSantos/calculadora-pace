"use client";

import {useState, type FormEvent} from "react";
import {ArrowRight, Check, Clock3} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {useUmami} from "@/hooks/use-umami";
import {PREMIUM_ANUAL_PLAN} from "../billing-access-provider";

const premiumBenefits = [
	"Ações ilimitadas para gel, água, isotônico e ajustes de ritmo.",
	"Mais liberdade para testar cenários antes do treino ou prova.",
	"Salve, exporte e carregue suas melhores estratégias.",
	"Recursos Premium futuros incluídos no plano anual.",
];

export function UpgradeDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const {trackCheckoutOpen, trackCheckoutSubmit, trackCheckoutAbandon} =
		useUmami();
	const plano = PREMIUM_ANUAL_PLAN;

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/checkout/infinite-pay/start", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({name, email}),
			});
			const data = (await response.json().catch(() => null)) as {
				url?: string;
				error?: string;
			} | null;

			if (!response.ok || !data?.url) {
				throw new Error(data?.error ?? "Não foi possível iniciar o checkout.");
			}
			trackCheckoutSubmit({
				stepIndex: 1,
				success: true,
				offerPrice: plano.preco,
			});
			window.location.assign(data.url);
		} catch (err: any) {
			setError(
				err instanceof Error
					? err.message
					: "Não foi possível iniciar o checkout.",
			);
			setIsSubmitting(false);
			trackCheckoutSubmit({
				stepIndex: 1,
				success: false,
				errorMessage: err.message,
				offerPrice: plano.preco,
			});
		}
	}

	const onOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			trackCheckoutAbandon({
				stepIndex: 1,
				stepTitle: "informacoes-cliente",
				offerPrice: plano.preco,
			});
			onClose();
		} else {
			trackCheckoutOpen({
				offerId: plano.id,
				offerName: plano.nome,
				price: plano.preco,
				currency: "BRL",
				source: "upgrade-dialog",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-h-[calc(100svh-1rem)] w-[calc(100vw-1rem)] max-w-lg overflow-hidden p-0 sm:max-h-[calc(100svh-2rem)] sm:w-full'>
				<form
					onSubmit={handleSubmit}
					className='flex max-h-[calc(100svh-1rem)] flex-col sm:max-h-[calc(100svh-2rem)]'
				>
					<div className='min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-3 sm:px-5 sm:pt-5'>
						<DialogHeader className='gap-2 pr-7'>
							<div className='flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-primary'>
								<Clock3 className='size-3.5' />
								Oferta até 25/07
							</div>
							<DialogTitle className='text-xl leading-tight text-balance sm:text-2xl'>
								Planeje sua prova sem limitar a estratégia
							</DialogTitle>
							<DialogDescription className='max-w-[40rem] leading-6'>
								Com o Premium, você monta um plano completo para ritmo,
								hidratação, carboidrato e decisões importantes do percurso.
							</DialogDescription>
						</DialogHeader>

						<div className='mt-4 overflow-hidden rounded-lg border border-primary/25 bg-primary/5'>
							<div className='grid grid-cols-[1fr_auto] gap-3 p-3 sm:p-4'>
								<div>
									<p className='text-xs font-medium text-muted-foreground'>
										Preço de lançamento
									</p>
									<div className='mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1'>
										<span className='text-2xl font-bold leading-none text-foreground sm:text-3xl'>
											R$19,90
										</span>
										<span className='text-sm font-medium text-muted-foreground'>
											/ano
										</span>
										<span className='text-sm text-muted-foreground line-through'>
											R$39,90
										</span>
									</div>
								</div>
								<div className='rounded-md bg-background/70 px-2.5 py-2 text-right'>
									<p className='text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground'>
										SP City
									</p>
									<p className='mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums'>
										26/07
									</p>
								</div>
							</div>
							<div className='border-t border-primary/15 px-3 py-2 text-xs leading-5 text-muted-foreground sm:px-4'>
								Um incentivo para chegar com a estratégia mais redonda em uma
								prova importante e desafiadora, sem limitar o uso a ela.
							</div>
						</div>

						<div className='mt-4 grid gap-2'>
							{premiumBenefits.map(benefit => (
								<div key={benefit} className='flex gap-2 text-sm leading-5'>
									<span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
										<Check className='size-3.5' />
									</span>
									<span>{benefit}</span>
								</div>
							))}
						</div>
					</div>

					<div className='shrink-0 border-t border-border bg-card px-4 py-3 sm:px-5 sm:py-4'>
						<div className='grid gap-3 sm:grid-cols-2'>
							<div className='space-y-1.5'>
								<label
									className='text-xs font-medium text-foreground'
									htmlFor='checkout-name'
								>
									Nome
								</label>
								<Input
									id='checkout-name'
									value={name}
									onChange={event => setName(event.target.value)}
									autoComplete='name'
									required
									placeholder='Seu nome'
									className='h-10 text-sm'
								/>
							</div>
							<div className='space-y-1.5'>
								<label
									className='text-xs font-medium text-foreground'
									htmlFor='checkout-email'
								>
									E-mail
								</label>
								<Input
									id='checkout-email'
									type='email'
									value={email}
									onChange={event => setEmail(event.target.value)}
									autoComplete='email'
									required
									placeholder='voce@email.com'
									className='h-10 text-sm'
								/>
							</div>
						</div>

						{error && (
							<p className='mt-2 rounded-md bg-destructive/10 px-2.5 py-2 text-xs leading-5 text-destructive'>
								{error}
							</p>
						)}

						<DialogFooter className='mt-3 grid gap-2 sm:grid-cols-[auto_1fr]'>
							<Button
								type='submit'
								disabled={isSubmitting}
								className='h-10 w-full'
							>
								<span>
									{isSubmitting
										? "Gerando checkout..."
										: "Assinar por R$19,90/ano"}
								</span>
								{!isSubmitting && <ArrowRight className='size-4' />}
							</Button>
							<Button
								type='button'
								variant='ghost'
								onClick={onClose}
								className='h-10 w-full sm:w-auto'
							>
								Continuar grátis
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
