import { PrismaClient } from "@prisma/client";
import { User, UserRole, UserStatus } from "../domain/user.entity";

const prisma = new PrismaClient();

/**
 * Parâmetros de filtro e paginação para listagem de usuários.
 */
export interface ListUsersParams {
  status?: UserStatus;
  role?: UserRole;
  page: number;
  size: number;
}

/**
 * Resultado paginado da listagem de usuários.
 */
export interface UserPage {
  items: User[];
  page: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

/**
 * Cria um novo usuário no banco de dados.
 *
 * @param data - Dados do usuário a ser criado.
 * @returns O usuário recém-criado.
 */
export async function createUser(data: {
  name: string;
  email: string;
  roles: UserRole[];
  keycloakId: string;
}): Promise<User> {
  return prisma.user.create({ data }) as Promise<User>;
}

/**
 * Busca um usuário pelo identificador único.
 *
 * @param id - UUID do usuário.
 * @returns O usuário encontrado ou `null`.
 */
export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } }) as Promise<User | null>;
}

/**
 * Busca um usuário pelo endereço de e-mail.
 *
 * @param email - E-mail do usuário.
 * @returns O usuário encontrado ou `null`.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } }) as Promise<User | null>;
}

/**
 * Lista usuários com filtros opcionais de status e role, com paginação.
 *
 * @param params - Parâmetros de filtro e paginação.
 * @returns Página de usuários e metadados de paginação.
 */
export async function listUsers(params: ListUsersParams): Promise<UserPage> {
  const { status, role, page, size } = params;

  const where: Record<string, unknown> = {};
  if (status) {
    where["status"] = status;
  }
  if (role) {
    where["roles"] = { has: role };
  }

  const [totalElements, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: page * size,
      take: size,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalElements / size);

  return {
    items: items as User[],
    page: { page, size, totalElements, totalPages },
  };
}

/**
 * Atualiza o nome de um usuário e registra a data de atualização.
 *
 * @param id - UUID do usuário.
 * @param name - Novo nome.
 * @returns O usuário atualizado.
 */
export async function updateUserName(id: string, name: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { name },
  }) as Promise<User>;
}

/**
 * Desativa logicamente um usuário, alterando seu status para `INACTIVE`
 * e registrando a data de desativação.
 *
 * @param id - UUID do usuário.
 * @returns O usuário desativado.
 */
export async function deactivateUser(id: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { status: "INACTIVE", deactivatedAt: new Date() },
  }) as Promise<User>;
}

/**
 * Substitui integralmente os papéis de um usuário.
 *
 * @param id - UUID do usuário.
 * @param roles - Nova lista de papéis.
 * @returns O usuário com os papéis atualizados.
 */
export async function replaceUserRoles(
  id: string,
  roles: UserRole[]
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { roles },
  }) as Promise<User>;
}
