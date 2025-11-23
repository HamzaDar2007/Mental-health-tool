import { Test, TestingModule } from '@nestjs/testing';
import { CrisisDetectorService } from './crisis-detector.service';

describe('CrisisDetectorService', () => {
  let service: CrisisDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrisisDetectorService],
    }).compile();

    service = module.get<CrisisDetectorService>(CrisisDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectCrisis', () => {
    it('should detect crisis keywords', async () => {
      const result = await service.detectCrisis('I want to kill myself');
      
      expect(result.isCrisis).toBe(true);
      expect(result.label).toBe('crisis');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.requiresReview).toBe(true);
    });

    it('should detect concern keywords', async () => {
      const result = await service.detectCrisis('I feel hopeless and worthless');
      
      expect(result.label).toBe('concern');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should return safe for normal messages', async () => {
      const result = await service.detectCrisis('I had a good day today');
      
      expect(result.isCrisis).toBe(false);
      expect(result.label).toBe('safe');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should analyze conversation context', async () => {
      const history = ['I feel sad', 'Nothing matters anymore', 'I am worthless'];
      const result = await service.detectCrisis('I can\'t take it', history);
      
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });
});