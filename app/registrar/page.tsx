import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";

import {RegistrarAnalytics} from "./registrar-analytics";

import {findByOrderNsu} from "@/lib/customer";
import {PAYMENT_AUTH_ENABLED} from "@/lib/payment-auth";

export const metadata: Metadata = {
	title: "Registrar acesso",
	description:
		"Finalize seu acesso pago ao Arsenal do Corredor após a confirmação do pagamento.",
	alternates: {
		canonical: "/registrar",
	},
};

type RegistrarPageProps = {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

function statusMessage(status: string | undefined) {
	if (status === "auth-error") {
		return "Não foi possível concluir a autenticação. Tente entrar novamente.";
	}
	if (status === "missing-order") {
		return "Não encontramos os dados do pagamento no link de retorno.";
	}
	return "Ainda estamos aguardando a confirmação do pagamento. Assim que o provedor confirmar, volte para esta página e continue o cadastro.";
}

export default async function RegistrarPage({
	searchParams,
}: RegistrarPageProps) {
	if (!PAYMENT_AUTH_ENABLED) redirect("/");

	const params = (await searchParams) ?? {};
	const orderNsu = firstParam(params.order_nsu)?.trim();
	const customer = orderNsu ? await findByOrderNsu(orderNsu) : null;
	const canRegister = Boolean(customer?.active);
	const transactionId =
		customer?.transactionNsu ?? customer?.orderNsu ?? orderNsu ?? null;
	const status = firstParam(params.status);
	const loginHref = orderNsu
		? `/api/auth/login?order_nsu=${encodeURIComponent(orderNsu)}`
		: "/api/auth/login";
	return (
		<main className='bg-background'>
			<RegistrarAnalytics
				paymentConfirmed={canRegister}
				transactionId={transactionId}
				amountPaidCents={customer?.amountPaidCents ?? null}
			/>
			<div className='mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14'>
				<header>
					<p className='text-sm font-medium text-primary'>Área paga</p>
					<h1 className='mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl'>
						Finalize seu acesso
					</h1>
					<p className='mt-3 max-w-2xl text-sm leading-6 text-muted-foreground'>
						Depois da confirmação do pagamento, entre ou crie sua conta pela
						Auth0 para liberar seu plano no Arsenal do Corredor.
					</p>
				</header>

				<section className=' p-5 sm:p-6'>
					{canRegister ? (
						<div className='space-y-4'>
							<div>
								<h2 className='text-lg font-semibold text-foreground'>
									Pagamento confirmado
								</h2>
								<p className='mt-2 text-sm leading-6 text-muted-foreground'>
									Seu plano foi localizado. Continue para entrar ou criar sua
									conta.
								</p>
							</div>
							<Link
								href={loginHref}
								className='inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
							>
								Continuar com autenticação
							</Link>
						</div>
					) : (
						<div className='space-y-3'>
							<h2 className='text-lg font-semibold text-foreground'>
								Confirmação em andamento
							</h2>
							<p className='text-sm leading-6 text-muted-foreground'>
								{statusMessage(status)}
							</p>
						</div>
					)}
				</section>
			</div>
		</main>
	);
}
