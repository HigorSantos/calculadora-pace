import {randomBytes, randomUUID} from "crypto";

export const AUTH0_STATE_COOKIE = "arsenal-auth0-state";
export const AUTH0_REGISTRATION_ORDER_COOKIE = "arsenal-registration-order";

const AUTH0_SCOPE = "openid profile email";

type Auth0Config = {
	domain: string;
	clientId: string;
	clientSecret: string;
	connection: string;
};

export type Auth0Profile = {
	sub: string;
	email?: string;
	name?: string;
};

function requiredEnv(name: string) {
	const value = process.env[name];
	if (!value) throw new Error(`${name} não configurado`);
	return value;
}

function auth0Config(): Auth0Config {
	return {
		domain: requiredEnv("AUTH0_DOMAIN").replace(/^https?:\/\//, ""),
		clientId: requiredEnv("AUTH0_CLIENT_ID"),
		clientSecret: requiredEnv("AUTH0_CLIENT_SECRET"),
		connection:
			process.env.AUTH0_DATABASE_CONNECTION ??
			"Username-Password-Authentication",
	};
}

export function createAuth0State() {
	return randomUUID();
}

export function auth0RedirectUri(origin: string) {
	return `${origin}/auth/callback`;
}

export function buildAuth0AuthorizeUrl(origin: string, state: string) {
	const config = auth0Config();
	const url = new URL(`https://${config.domain}/authorize`);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("client_id", config.clientId);
	url.searchParams.set("redirect_uri", auth0RedirectUri(origin));
	url.searchParams.set("scope", AUTH0_SCOPE);
	url.searchParams.set("state", state);
	return url;
}

export function buildAuth0LogoutUrl(origin: string) {
	const config = auth0Config();
	const url = new URL(`https://${config.domain}/v2/logout`);
	url.searchParams.set("client_id", config.clientId);
	url.searchParams.set("returnTo", `${origin}/`);
	return url;
}

export async function exchangeAuth0Code(origin: string, code: string) {
	const config = auth0Config();
	const response = await fetch(`https://${config.domain}/oauth/token`, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			grant_type: "authorization_code",
			client_id: config.clientId,
			client_secret: config.clientSecret,
			code,
			redirect_uri: auth0RedirectUri(origin),
		}),
	});

	if (!response.ok) {
		throw new Error("Falha ao trocar código Auth0 por token");
	}

	const token = (await response.json()) as {access_token?: string};
	if (!token.access_token) throw new Error("Auth0 não retornou access_token");
	return token.access_token;
}

export async function fetchAuth0Profile(
	accessToken: string,
): Promise<Auth0Profile> {
	const config = auth0Config();
	const response = await fetch(`https://${config.domain}/userinfo`, {
		headers: {Authorization: `Bearer ${accessToken}`},
	});

	if (!response.ok) throw new Error("Falha ao buscar perfil Auth0");

	const profile = (await response.json()) as Auth0Profile;
	if (!profile.sub) throw new Error("Perfil Auth0 sem sub");
	return profile;
}

export type CreateAuth0UserResult = {
	created: boolean;
	userId: string | null;
};

async function getAuth0ManagementToken() {
	const config = auth0Config();
	const response = await fetch(`https://${config.domain}/oauth/token`, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			grant_type: "client_credentials",
			client_id: config.clientId,
			client_secret: config.clientSecret,
			audience: `https://${config.domain}/api/v2/`,
		}),
	});

	if (!response.ok) {
		console.log(await response.json());
		throw new Error("Falha ao obter token da Management API Auth0");
	}

	const token = (await response.json()) as {access_token?: string};
	if (!token.access_token) {
		throw new Error("Auth0 Management API não retornou access_token");
	}
	return token.access_token;
}

function generateTemporaryPassword() {
	return `${randomBytes(24).toString("base64url")}Aa1!`;
}

export async function createAuth0DatabaseUser(
	email: string,
): Promise<CreateAuth0UserResult> {
	console.debug("Criando usuário Auth0 para email:", email);
	const config = auth0Config();
	const accessToken = await getAuth0ManagementToken();
	const normalizedEmail = email.trim().toLowerCase();
	const response = await fetch(`https://${config.domain}/api/v2/users`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			connection: config.connection,
			email: normalizedEmail,
			// password: generateTemporaryPassword(),
			email_verified: false,
			// verify_email: true,
			user_metadata: {
				criacao: new Date().toISOString(),
			},
			app_metadata: {needsInvitation: true},
		}),
	});

	if (response.status === 409) {
		return {created: false, userId: null};
	}

	if (!response.ok) {
		throw new Error("Falha ao criar usuário na Auth0");
	}

	console.debug(
		"Usuário Auth0 criado com sucesso para email:",
		normalizedEmail,
	);
	// envia email de redefinição de senha para o usuário recém-criado
	// o email vai diferente para ele criar uma senha
	fetch(`https://${config.domain}/dbconnections/change_password`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			connection: config.connection,
			email: normalizedEmail,
		}),
	})
		.then(async res => {
			if (!res.ok) {
				console.error(
					"Falha ao enviar email de redefinição de senha",
					await res.json(),
				);
			} else {
				console.log(
					"Email de redefinição de senha enviado com sucesso para",
					normalizedEmail,
				);
			}
		})
		.catch(err => {
			console.error("Erro ao enviar email de redefinição de senha", err);
		});

	const user = (await response.json()) as {user_id?: string};
	return {created: true, userId: user.user_id ?? null};
}
