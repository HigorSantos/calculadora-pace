import type {Metadata} from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Termos de uso",
	description:
		"Termos aplicáveis ao uso das ferramentas do Arsenal do Corredor.",
	alternates: {
		canonical: "/termos-de-uso",
	},
};

export default function TermosDeUsoPage() {
	return (
		<main className='bg-background'>
			<div className='mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14'>
				<header className='mb-10'>
					<p className='text-sm font-medium text-primary'>
						Arsenal do Corredor
					</p>
					<h1 className='mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl'>
						Termos de uso
					</h1>
					<p className='mt-3 text-sm leading-6 text-muted-foreground'>
						Estes termos definem as condições aplicáveis ao uso das ferramentas
						e recursos disponibilizados pelo Arsenal do Corredor.
					</p>
				</header>

				<section className='space-y-8 text-sm leading-7 text-muted-foreground'>
					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Aceitação dos termos
						</h2>
						<p className='mt-2'>
							Ao utilizar as ferramentas do site, o usuário declara ter lido,
							compreendido e concordado integralmente com estes Termos de Uso e
							com a{" "}
							<Link
								href='/politica-de-privacidade'
								className='font-medium text-primary hover:underline'
							>
								política de privacidade
							</Link>
							.
						</p>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Ferramentas
						</h2>
						<p className='mt-2'>
							As ferramentas do site são disponibilizadas como estão e devem ser
							utilizadas sem alterações pelo usuário. O uso deve ocorrer com
							discrição e responsabilidade, cabendo ao usuário avaliar os
							resultados apresentados antes de aplicá-los em sua rotina.
						</p>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Versão Premium
						</h2>
						<p className='mt-2'>
							Ao assinar o plano Premium com pagamento anual, o site
							disponibiliza ferramentas extras ao usuário. O uso dessas
							funcionalidades Premium continua sujeito aos mesmos Termos de Uso
							e à política de privacidade.
						</p>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>Pagamento</h2>
						<p className='mt-2'>
							O valor é cobrado anualmente, diretamente pela plataforma em que o
							cliente realizou o primeiro pagamento.
						</p>
						<ul className='mt-3 list-disc space-y-2 pl-5'>
							<li>
								Os valores informados incluem todos os tributos aplicáveis,
								salvo quando expressamente indicado.
							</li>
							<li>
								O não pagamento na data de vencimento poderá acarretar a
								suspensão do uso das funcionalidades Premium.
							</li>
							<li>
								Doações realizadas pelo Buy Me a Coffee não configuram compra do
								plano Premium; elas são consideradas ajudas voluntárias para
								manter o site.
							</li>
						</ul>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Como a plataforma não deve ser utilizada
						</h2>
						<ul className='mt-3 list-disc space-y-2 pl-5'>
							<li>Como treinador.</li>
							<li>
								Fornecer dados falsos, incompletos ou de terceiros sem
								autorização.
							</li>
							<li>
								Introduzir vírus, malwares, scripts maliciosos ou qualquer
								código que possa danificar, sobrecarregar ou comprometer o
								funcionamento da plataforma.
							</li>
							<li>
								Realizar engenharia reversa, descompilar ou tentar extrair o
								código-fonte da plataforma.
							</li>
							<li>
								Utilizar mecanismos automatizados, como bots, scrapers ou
								crawlers, para coletar dados ou interagir com a plataforma de
								forma não autorizada.
							</li>
							<li>
								Usar a plataforma para fins ilícitos, fraudulentos ou contrários
								à ordem pública e aos bons costumes.
							</li>
							<li>
								Reproduzir, copiar, distribuir ou comercializar qualquer
								conteúdo da plataforma sem autorização prévia.
							</li>
						</ul>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Atualização dos termos
						</h2>
						<p className='mt-2'>
							Estes termos podem ser atualizados para refletir mudanças nas
							ferramentas, planos ou obrigações aplicáveis. A versão vigente
							estará sempre disponível nesta página e alterações serão exibidas
							logo abaixo com data e o que foi alterado.
						</p>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Atualizações
						</h2>
						<p className='mt-2'>13/07/2026: Versão inicial.</p>
					</div>
				</section>
			</div>
		</main>
	);
}
