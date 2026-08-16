"use client";

import {useEffect, useState, type FormEvent} from "react";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {ArrowLeft, ArrowRight, Check, Clock3} from "lucide-react";

import {PREMIUM_ANUAL_PLAN} from "@/components/billing-access-provider";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useUmami} from "@/hooks/use-umami";

const premiumBenefits = [
	"Ações ilimitadas para gel, água, isotônico e ajustes de ritmo.",
	"Mais liberdade para testar cenários antes do treino ou prova.",
	"Salve, exporte e carregue suas melhores estratégias.",
	"Recursos Premium futuros incluídos no plano anual.",
];

export function PremiumUpgradePage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const source = searchParams.get("source") ?? "direct";
	const {
		trackCheckoutOpen,
		trackCheckoutSubmit,
		trackCheckoutAbandon,
		trackEvent,
	} = useUmami();
	const plano = PREMIUM_ANUAL_PLAN;

	useEffect(() => {
		trackCheckoutOpen({
			offerId: plano.id,
			offerName: plano.nome,
			price: plano.preco,
			currency: "BRL",
			source,
		});
		trackEvent("premium_page_view", {
			source,
			offer_id: plano.id,
			offer_price: plano.preco,
		});
	}, [
		plano.id,
		plano.nome,
		plano.preco,
		source,
		trackCheckoutOpen,
		trackEvent,
	]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		if (!acceptedTerms) {
			setError(
				"Para continuar, aceite os termos de uso e a política de privacidade.",
			);
			trackEvent("premium_terms_required", {
				source,
				offer_id: plano.id,
				offer_price: plano.preco,
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/checkout/infinite-pay/start", {
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({name, email, source, acceptedTerms}),
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
			trackEvent("premium_checkout_submit", {
				source,
				success: true,
				accepted_terms: acceptedTerms,
				offer_id: plano.id,
				offer_price: plano.preco,
			});
			window.location.assign(data.url);
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: "Não foi possível iniciar o checkout.";
			setError(message);
			setIsSubmitting(false);
			trackCheckoutSubmit({
				stepIndex: 1,
				success: false,
				errorMessage: message,
				offerPrice: plano.preco,
			});
			trackEvent("premium_checkout_submit", {
				source,
				success: false,
				accepted_terms: acceptedTerms,
				error_message: message,
				offer_id: plano.id,
				offer_price: plano.preco,
			});
		}
	}

	function continueFree() {
		trackCheckoutAbandon({
			stepIndex: 1,
			stepTitle: "informacoes-cliente",
			offerPrice: plano.preco,
		});
		trackEvent("premium_continue_free", {
			source,
			offer_id: plano.id,
			offer_price: plano.preco,
		});
		router.back();
	}

	return (
		<main className='bg-background'>
			<div className='mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col px-4 py-8 sm:py-12'>
				<div className='mb-5'>
					<Link
						href='/'
						className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
					>
						<ArrowLeft className='size-4' />
						Voltar para a calculadora
					</Link>
				</div>

				<form
					onSubmit={handleSubmit}
					className='mx-auto grid w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]'
				>
					<section className='px-4 pt-4 pb-5 sm:px-6 sm:pt-6 lg:px-8 lg:py-8'>
						<div className='flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-primary'>
							<Clock3 className='size-3.5' />
							Oferta até 25/07
						</div>
						<h1 className='mt-3 text-2xl font-bold leading-tight text-balance sm:text-3xl lg:text-4xl'>
							Planeje sua prova sem limitar a estratégia
						</h1>
						<p className='mt-3 max-w-[40rem] leading-6 text-muted-foreground'>
							Com o Premium, você monta um plano completo para ritmo,
							hidratação, carboidrato e decisões importantes do percurso.
						</p>

						<div className='mt-5 overflow-hidden rounded-lg border border-primary/25 bg-primary/5'>
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

						<div className='mt-5 grid gap-2'>
							{premiumBenefits.map(benefit => (
								<div key={benefit} className='flex gap-2 text-sm leading-5'>
									<span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
										<Check className='size-3.5' />
									</span>
									<span>{benefit}</span>
								</div>
							))}
						</div>
					</section>

					<section className='border-t border-border bg-muted/25 px-4 py-4 sm:px-6 sm:py-5 lg:border-t-0 lg:border-l lg:px-6 lg:py-8'>
						<div className='grid gap-3'>
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
									className='h-10 bg-background text-sm'
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
									className='h-10 bg-background text-sm'
								/>
							</div>
						</div>

						<div className='mt-4 flex flex-row items-center gap-2.5'>
							<input
								id='checkout-terms'
								type='checkbox'
								checked={acceptedTerms}
								onChange={event => setAcceptedTerms(event.target.checked)}
								required
								className='mt-0.5 size-4 shrink-0 accent-primary'
							/>
							<label
								className='cursor-pointer text-xs leading-5 text-muted-foreground'
								htmlFor='checkout-terms'
							>
								Li e aceito os{" "}
								<Link
									href='/termos-de-uso'
									target='_blank'
									rel='noreferrer'
									className='font-medium text-primary underline-offset-4 hover:underline'
								>
									termos de uso
								</Link>{" "}
								e a{" "}
								<Link
									href='/politica-de-privacidade'
									target='_blank'
									rel='noreferrer'
									className='font-medium text-primary underline-offset-4 hover:underline'
								>
									política de privacidade
								</Link>
								.
							</label>
						</div>

						{error && (
							<p className='mt-3 rounded-md bg-destructive/10 px-2.5 py-2 text-xs leading-5 text-destructive'>
								{error}
							</p>
						)}

						<div className='mt-4 grid gap-2'>
							<Button
								type='submit'
								disabled={isSubmitting || !acceptedTerms}
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
								onClick={continueFree}
								className='h-10 w-full'
							>
								Continuar grátis
							</Button>
						</div>
					</section>
				</form>
			</div>
		</main>
	);
}
