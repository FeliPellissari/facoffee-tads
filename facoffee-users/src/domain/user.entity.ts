/**
 * Papéis de domínio disponíveis para um usuário.
 */
export type UserRole = "MANAGER" | "PARTICIPANT";

/**
 * Status de ativação da conta de um usuário.
 */
export type UserStatus = "ACTIVE" | "INACTIVE";

/**
 * Representa a entidade User no domínio da aplicação.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  roles: UserRole[];
  keycloakId: string;
  createdAt: Date;
  updatedAt: Date | null;
  deactivatedAt: Date | null;
}
