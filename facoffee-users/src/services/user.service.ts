import { User, UserRole } from "../domain/user.entity";
import { EmailConflictError, UserNotFoundError } from "../domain/user.errors";
import * as userRepository from "../repositories/user.repository";
import { ListUsersParams, UserPage } from "../repositories/user.repository";
import { createKeycloakUser, replaceKeycloakUserRoles } from "./keycloak.service";
import { publishUserDeactivated } from "../events/publisher";

/**
 * Cria um novo usuário no domínio e no Keycloak.
 *
 * @param data - Dados do usuário a ser criado.
 * @returns O usuário recém-criado.
 * @throws {EmailConflictError} Se o e-mail já estiver cadastrado.
 */
export async function createUser(data: {
  name: string;
  email: string;
  roles?: UserRole[];
}): Promise<User> {
  const existing = await userRepository.findUserByEmail(data.email);
  if (existing) {
    throw new EmailConflictError(data.email);
  }

  const roles = data.roles && data.roles.length > 0 ? data.roles : ["PARTICIPANT" as UserRole];

  const keycloakId = await createKeycloakUser(data.name, data.email);

  await replaceKeycloakUserRoles(keycloakId, roles);

  return userRepository.createUser({
    name: data.name,
    email: data.email,
    roles,
    keycloakId,
  });
}

/**
 * Lista usuários com filtros e paginação.
 *
 * @param params - Parâmetros de filtro e paginação.
 * @returns Página de usuários.
 */
export async function listUsers(params: ListUsersParams): Promise<UserPage> {
  return userRepository.listUsers(params);
}

/**
 * Busca um usuário pelo identificador único.
 *
 * @param userId - UUID do usuário.
 * @returns O usuário encontrado.
 * @throws {UserNotFoundError} Se o usuário não existir.
 */
export async function getUserById(userId: string): Promise<User> {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new UserNotFoundError(userId);
  }
  return user;
}

/**
 * Atualiza o nome básico de um usuário.
 *
 * @param userId - UUID do usuário.
 * @param name - Novo nome.
 * @returns O usuário atualizado.
 * @throws {UserNotFoundError} Se o usuário não existir.
 */
export async function updateUser(userId: string, name: string): Promise<User> {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new UserNotFoundError(userId);
  }
  return userRepository.updateUserName(userId, name);
}

/**
 * Desativa logicamente um usuário e publica o evento `UserDeactivated`.
 *
 * @param userId - UUID do usuário.
 * @param reason - Motivo da desativação.
 * @returns O usuário desativado.
 * @throws {UserNotFoundError} Se o usuário não existir.
 */
export async function deactivateUser(
  userId: string,
  reason: string
): Promise<User> {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new UserNotFoundError(userId);
  }

  const deactivated = await userRepository.deactivateUser(userId);

  await publishUserDeactivated({ userId, reason });

  return deactivated;
}

/**
 * Substitui integralmente os papéis de um usuário no domínio e no Keycloak.
 *
 * @param userId - UUID do usuário.
 * @param roles - Nova lista de papéis.
 * @returns O usuário com papéis atualizados.
 * @throws {UserNotFoundError} Se o usuário não existir.
 */
export async function replaceUserRoles(
  userId: string,
  roles: UserRole[]
): Promise<User> {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new UserNotFoundError(userId);
  }

  await replaceKeycloakUserRoles(user.keycloakId, roles);

  return userRepository.replaceUserRoles(userId, roles);
}
