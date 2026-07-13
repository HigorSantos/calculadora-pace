import {Analytics} from "@vercel/analytics/next";
import type {Metadata, Viewport} from "next";
import {Geist, Geist_Mono, Manrope} from "next/font/google";
import {SiteFooter, SiteHeader} from "@/components/site-chrome";
import {BillingAccessProvider} from "@/components/billing-access-provider";
import {UnitSystemProvider} from "@/components/unit-system-provider";
import "./globals.css";

const ManropeSans = Manrope({
	variable: "--font-manrope-sans",
	subsets: ["latin"],
});
const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const themeInitializer = `
(() => {
  try {
    const theme = window.localStorage.getItem('arsenal-theme')
    const root = document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'light' || theme === 'dark') {
      root.classList.add(theme)
    }
  } catch {}
})()
`;

export const metadata: Metadata = {
	metadataBase: new URL("https://arsenaldocorredor.com.br"),
	title: {
		default: "Arsenal do Corredor",
		template: "%s | Arsenal do Corredor",
	},
	description:
		"Ferramentas para corredores planejarem pace, ritmo, treinos e estratégias de prova com mais clareza.",
	applicationName: "Arsenal do Corredor",
	openGraph: {
		title: "Arsenal do Corredor",
		description:
			"Ferramentas simples e objetivas para planejar ritmo, treinos e provas.",
		url: "https://arsenaldocorredor.com.br/",
		siteName: "Arsenal do Corredor",
		locale: "pt_BR",
		type: "website",
	},
	alternates: {
		canonical: "/",
	},
};

export const viewport: Viewport = {
	colorScheme: "light dark",
	themeColor: [
		{media: "(prefers-color-scheme: light)", color: "white"},
		{media: "(prefers-color-scheme: dark)", color: "black"},
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang='pt-BR'
			suppressHydrationWarning
			className={`${ManropeSans.variable} ${geistMono.variable} bg-background`}
		>
			<head>
				<script dangerouslySetInnerHTML={{__html: themeInitializer}} />
				<script
					defer
					src='https://cloud.umami.is/script.js'
					data-website-id='632cb03e-6be7-4157-ace1-17ca416b0596'
				></script>
			</head>
			<body className='font-sans antialiased'>
				<BillingAccessProvider>
					<UnitSystemProvider>
						<div className='flex min-h-svh flex-col'>
							<SiteHeader />
							<div className='flex-1'>{children}</div>
							<SiteFooter />
						</div>
					</UnitSystemProvider>
				</BillingAccessProvider>
				{process.env.NODE_ENV === "production" && <Analytics />}
			</body>
		</html>
	);
}
