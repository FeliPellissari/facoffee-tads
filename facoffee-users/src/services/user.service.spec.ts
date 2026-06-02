// @ts-nocheck
import * as userService from './user.service';
import * as userRepository from '../repositories/user.repository';
import * as keycloakService from './keycloak.service';
import * as publisher from '../events/publisher';
import { EmailConflictError } from '../domain/user.errors';

// 1. Criando os "dublês" (mocks) das camadas externas
jest.mock('../repositories/user.repository');
jest.mock('./keycloak.service');
jest.mock('../events/publisher');

describe('UserService Unit Tests', () => {
  // Limpa o histórico dos dublês antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('deve criar um usuário com sucesso se o email for único', async () => {
      jest.mocked(userRepository.findUserByEmail).mockResolvedValue(null);
      jest.mocked(keycloakService.createKeycloakUser).mockResolvedValue('kc-123');
      
      const mockCreatedUser = { 
        id: '1', name: 'Novo User', email: 'novo@teste.com', 
        roles: ['MANAGER'], keycloakId: 'kc-123', 
        status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() 
      };
      
      jest.mocked(userRepository.createUser).mockResolvedValue(mockCreatedUser);

      const result = await userService.createUser({ name: 'Novo User', email: 'novo@teste.com', roles: ['MANAGER'] });

      expect(result.email).toEqual('novo@teste.com');
      expect(keycloakService.createKeycloakUser).toHaveBeenCalledWith('Novo User', 'novo@teste.com');
    });

    it('deve lançar EmailConflictError se o email for duplicado', async () => {
      const mockExisting = { 
        id: '2', name: 'Duplicado', email: 'duplicado@teste.com', 
        roles: ['PARTICIPANT'], keycloakId: 'kc-2', 
        status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() 
      };
      
      jest.mocked(userRepository.findUserByEmail).mockResolvedValue(mockExisting);

      await expect(
        userService.createUser({ name: 'Duplicado', email: 'duplicado@teste.com' })
      ).rejects.toThrow(EmailConflictError);
    });

    it('deve atribuir ["PARTICIPANT"] se nenhuma role for enviada', async () => {
      jest.mocked(userRepository.findUserByEmail).mockResolvedValue(null);
      jest.mocked(keycloakService.createKeycloakUser).mockResolvedValue('kc-999');
      
      const mockCreated = { 
        id: '3', name: 'Sem Role', email: 'semrole@teste.com', 
        roles: ['PARTICIPANT'], keycloakId: 'kc-999', 
        status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() 
      };
      jest.mocked(userRepository.createUser).mockResolvedValue(mockCreated);

      await userService.createUser({ name: 'Sem Role', email: 'semrole@teste.com' });

      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ['PARTICIPANT'] })
      );
    });
  });

  describe('deactivateUser', () => {
    it('deve desativar usuário existente preenchendo status INACTIVE e deactivatedAt', async () => {
      const mockUser = { 
        id: 'user-1', name: 'User 1', email: 'u1@teste.com', 
        roles: ['PARTICIPANT'], keycloakId: 'kc-u1', 
        status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() 
      };
      const deactivatedUser = { 
        ...mockUser, status: 'INACTIVE', deactivatedAt: new Date() 
      };

      jest.mocked(userRepository.findUserById).mockResolvedValue(mockUser);
      jest.mocked(userRepository.deactivateUser).mockResolvedValue(deactivatedUser);

      const result = await userService.deactivateUser('user-1', 'Saiu da empresa');

      expect(result.status).toBe('INACTIVE');
      expect(result.deactivatedAt).toBeDefined();
      expect(publisher.publishUserDeactivated).toHaveBeenCalledWith({ userId: 'user-1', reason: 'Saiu da empresa' });
    });
  });

  describe('replaceUserRoles', () => {
    it('deve substituir os papéis integralmente sem fazer merge', async () => {
      const mockUser = { 
        id: 'user-2', name: 'User 2', email: 'u2@teste.com', 
        roles: ['PARTICIPANT'], keycloakId: 'kc-2', 
        status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() 
      };
      const updatedUser = { 
        ...mockUser, roles: ['MANAGER'] 
      };

      jest.mocked(userRepository.findUserById).mockResolvedValue(mockUser);
      jest.mocked(userRepository.replaceUserRoles).mockResolvedValue(updatedUser);

      const result = await userService.replaceUserRoles('user-2', ['MANAGER']);

      expect(result.roles).toEqual(['MANAGER']);
      expect(keycloakService.replaceKeycloakUserRoles).toHaveBeenCalledWith('kc-2', ['MANAGER']);
      expect(userRepository.replaceUserRoles).toHaveBeenCalledWith('user-2', ['MANAGER']);
    });
  });
});