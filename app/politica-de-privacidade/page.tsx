import type {Metadata} from "next";

export const metadata: Metadata = {
	title: "Política de privacidade",
	description:
		"Como o Arsenal do Corredor trata dados de identificação, pagamento e comunicação com clientes.",
	alternates: {
		canonical: "/politica-de-privacidade",
	},
};

export default function PoliticaDePrivacidadePage() {
	return (
		<main className='bg-background'>
			<div className='mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14'>
				<header className='mb-10'>
					<p className='text-sm font-medium text-primary'>
						Arsenal do Corredor
					</p>
					<h1 className='mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl'>
						Política de privacidade
					</h1>
					<p className='mt-3 text-sm leading-6 text-muted-foreground'>
						Esta política resume como tratamos os dados relacionados ao uso das
						ferramentas e planos do Arsenal do Corredor.
					</p>
				</header>

				<section className='space-y-8 text-sm leading-7 text-muted-foreground'>
					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Dados de pagamento
						</h2>
						<p className='mt-2'>
							Não armazenamos dados de pagamento, chave Pix do cliente, número
							de cartão, código de segurança, dados bancários ou informações
							equivalentes. Quando houver pagamento, o processamento é realizado
							pelo provedor de pagamento responsável pela transação.
						</p>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Compartilhamento de dados
						</h2>
						<p className='mt-2'>
							Não compartilhamos e não compartilharemos dados dos usuários com
							terceiros para venda, repasse comercial ou uso externo à operação
							do Arsenal do Corredor.
						</p>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Dados de identificação
						</h2>
						<p className='mt-2'>
							Dados como email ou telefone, quando solicitados, serão utilizados
							somente para identificar o cliente, notificar vencimentos de plano
							e comunicar novas ferramentas do Arsenal do Corredor.
						</p>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							LGPD e Marco Civil da Internet
						</h2>
						<p className='mt-2'>
							Ao se cadastrar, dados como IP e porta lógica devem ser salvos de
							acordo com a Lei 12.965/2014, conhecida como Marco Civil da
							Internet, bem como e-mail e telefone quando solicitados. O
							tratamento desses dados observa as bases e finalidades previstas
							na LGPD. Para solicitar a remoção de dados, envie um email para
							contato@arsenaldocorredor.com.br.
						</p>
					</div>

					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Atualizações
						</h2>
						<p className='mt-2'>
							Esta política pode ser atualizada para refletir mudanças nas
							ferramentas, planos ou obrigações aplicáveis. A versão vigente
							estará sempre disponível nesta página e alterações serão exibidas
							logo abaixo com data e o que foi alterado.
						</p>
					</div>
					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							Alterações
						</h2>
						<p className='mt-2'>13/07/2026: Versão inicial.</p>
					</div>
				</section>
			</div>
		</main>
	);
}
