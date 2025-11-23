import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionsService } from './sessions.service';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

describe('SessionsService', () => {
  let service: SessionsService;
  let sessionRepository: Repository<Session>;
  let userRepository: Repository<User>;

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(Session),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a session without user', async () => {
      const mockSession = { id: 'session-id', consented: false };
      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValue(mockSession);

      const result = await service.createSession({});
      
      expect(result).toEqual(mockSession);
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        userId: undefined,
        consented: false,
        metadata: {},
        safeMode: false
      });
    });

    it('should create a session with user', async () => {
      const mockUser = { id: 'user-id', locale: 'en' };
      const mockSession = { id: 'session-id', userId: 'user-id' };
      
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockSessionRepository.create.mockReturnValue(mockSession);
      mockSessionRepository.save.mockResolvedValue(mockSession);

      const result = await service.createSession({ locale: 'en' });
      
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        locale: 'en',
        ageRange: undefined,
        consented: false
      });
    });
  });
});