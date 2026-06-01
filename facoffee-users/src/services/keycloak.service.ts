import { env } from "../config/env";
import { UserRole } from "../domain/user.entity";

/**
 * Obtém um token de acesso para a Admin API do Keycloak usando client_credentials.
 *
 * @returns Access token como string.
 */
async function getAdminToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.keycloakClientId,
    client_secret: env.keycloakClientSecret,
  });

  const response = await fetch(
    `${env.keycloakIssuer}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Falha ao obter token admin do Keycloak: ${response.status}`
    );
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Cria um usuário no realm `facoffee` do Keycloak.
 * Após a criação, busca e retorna o ID gerado pelo Keycloak.
 *
 * @param name - Nome do usuário.
 * @param email - E-mail do usuário (usado como username).
 * @returns O ID do usuário criado no Keycloak.
 */
export async function createKeycloakUser(
  name: string,
  email: string
): Promise<string> {
  const token = await getAdminToken();
  const adminBase = `${env.keycloakAdminUrl}/admin/realms/facoffee`;

  const response = await fetch(`${adminBase}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username: email,
      email,
      firstName: name,
      enabled: true,
      emailVerified: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao criar usuário no Keycloak: ${response.status}`);
  }

  const searchResponse = await fetch(
    `${adminBase}/users?email=${encodeURIComponent(email)}&exact=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchResponse.ok) {
    throw new Error(
      `Falha ao buscar usuário no Keycloak após criação: ${searchResponse.status}`
    );
  }

  const users = (await searchResponse.json()) as Array<{ id: string }>;

  if (!users.length || !users[0]) {
    throw new Error(
      "Usuário criado no Keycloak mas não encontrado na busca subsequente"
    );
  }

  const keycloakId = users[0].id;

  await fetch(`${adminBase}/users/${keycloakId}/send-verify-email`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });

  return keycloakId;
}

/**
 * Substitui integralmente as roles de realm de um usuário no Keycloak.
 * Remove as roles atuais e adiciona as novas.
 *
 * @param keycloakId - ID do usuário no Keycloak.
 * @param roles - Nova lista de papéis de domínio.
 */
export async function replaceKeycloakUserRoles(
  keycloakId: string,
  roles: UserRole[]
): Promise<void> {
  const token = await getAdminToken();
  const adminBase = `${env.keycloakAdminUrl}/admin/realms/facoffee`;
  const roleMappingsUrl = `${adminBase}/users/${keycloakId}/role-mappings/realm`;

  const availableResponse = await fetch(`${adminBase}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!availableResponse.ok) {
    throw new Error(
      `Falha ao listar roles do realm no Keycloak: ${availableResponse.status}`
    );
  }

  const allRoles = (await availableResponse.json()) as Array<{
    id: string;
    name: string;
  }>;

  const currentResponse = await fetch(roleMappingsUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (currentResponse.ok) {
    const currentRoles = (await currentResponse.json()) as Array<{
      id: string;
      name: string;
    }>;

    if (currentRoles.length > 0) {
      await fetch(roleMappingsUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(currentRoles),
      });
    }
  }

  const rolesToAdd = allRoles.filter((r) => roles.includes(r.name as UserRole));

  if (rolesToAdd.length > 0) {
    const addResponse = await fetch(roleMappingsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(rolesToAdd),
    });

    if (!addResponse.ok) {
      throw new Error(
        `Falha ao adicionar roles no Keycloak: ${addResponse.status}`
      );
    }
  }
}
