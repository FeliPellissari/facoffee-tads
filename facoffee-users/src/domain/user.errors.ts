/**
 * Lançado quando se tenta cadastrar um usuário com um e-mail já existente no domínio.
 */
export class EmailConflictError extends Error {
  constructor(email: string) {
    super(`E-mail já cadastrado: ${email}`);
    this.name = "EmailConflictError";
  }
}

/**
 * Lançado quando um usuário não é encontrado pelo identificador informado.
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`Usuário não encontrado: ${userId}`);
    this.name = "UserNotFoundError";
  }
}

/**
 * Lançado quando uma operação de autenticação falha (token ausente ou inválido).
 */
export class UnauthorizedError extends Error {
  constructor(message = "Token ausente ou inválido") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Lançado quando o usuário autenticado não possui permissão para a operação.
 */
export class ForbiddenError extends Error {
  constructor(message = "Acesso negado") {
    super(message);
    this.name = "ForbiddenError";
  }
}
