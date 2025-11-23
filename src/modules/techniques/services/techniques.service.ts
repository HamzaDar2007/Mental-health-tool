import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technique } from '../entities/technique.entity';

@Injectable()
export class TechniquesService {
  constructor(
    @InjectRepository(Technique)
    private techniqueRepository: Repository<Technique>
  ) {}

  async findByLocale(locale: string = 'en'): Promise<Technique[]> {
    return await this.techniqueRepository.find({
      where: { locale, active: true },
      order: { category: 'ASC', title: 'ASC' }
    });
  }

  async findByKey(key: string, locale: string = 'en'): Promise<Technique | null> {
    return await this.techniqueRepository.findOne({
      where: { key, locale, active: true }
    });
  }

  async getRandomTechnique(locale: string = 'en', category?: string): Promise<Technique | null> {
    const query = this.techniqueRepository.createQueryBuilder('technique')
      .where('technique.locale = :locale', { locale })
      .andWhere('technique.active = :active', { active: true });

    if (category) {
      query.andWhere('technique.category = :category', { category });
    }

    const techniques = await query.getMany();
    
    if (techniques.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * techniques.length);
    return techniques[randomIndex];
  }

  async create(techniqueData: Partial<Technique>): Promise<Technique> {
    const technique = this.techniqueRepository.create(techniqueData);
    return await this.techniqueRepository.save(technique);
  }

  async seedDefaultTechniques(): Promise<void> {
    const defaultTechniques = [
      {
        key: 'box_breathing',
        title: 'Box Breathing',
        locale: 'en',
        category: 'breathing',
        description: 'A simple breathing technique to reduce anxiety and stress',
        durationSeconds: 240,
        steps: [
          'Find a comfortable position and close your eyes',
          'Breathe in slowly through your nose for 4 counts',
          'Hold your breath for 4 counts',
          'Exhale slowly through your mouth for 4 counts',
          'Hold empty for 4 counts',
          'Repeat this cycle 4-6 times'
        ]
      },
      {
        key: '5_4_3_2_1_grounding',
        title: '5-4-3-2-1 Grounding',
        locale: 'en',
        category: 'grounding',
        description: 'A grounding technique using your five senses',
        durationSeconds: 300,
        steps: [
          'Look around and name 5 things you can see',
          'Notice 4 things you can touch or feel',
          'Listen for 3 things you can hear',
          'Identify 2 things you can smell',
          'Think of 1 thing you can taste',
          'Take a few deep breaths and notice how you feel now'
        ]
      },
      {
        key: 'progressive_muscle_relaxation',
        title: 'Progressive Muscle Relaxation',
        locale: 'en',
        category: 'relaxation',
        description: 'Tense and relax different muscle groups to reduce physical tension',
        durationSeconds: 600,
        steps: [
          'Sit or lie down comfortably',
          'Start with your toes - tense for 5 seconds, then relax',
          'Move to your calves - tense and relax',
          'Continue with thighs, abdomen, hands, arms, shoulders',
          'Tense your face muscles, then relax',
          'Notice the difference between tension and relaxation',
          'Take a few deep breaths and enjoy the relaxed feeling'
        ]
      },
      {
        key: 'mindful_breathing',
        title: 'Mindful Breathing',
        locale: 'en',
        category: 'mindfulness',
        description: 'Focus on your breath to center yourself in the present moment',
        durationSeconds: 180,
        steps: [
          'Sit comfortably with your back straight',
          'Close your eyes or soften your gaze',
          'Notice your natural breathing rhythm',
          'Focus on the sensation of air entering and leaving your nose',
          'When your mind wanders, gently return focus to your breath',
          'Continue for a few minutes, breathing naturally'
        ]
      }
    ];

    for (const techniqueData of defaultTechniques) {
      const existing = await this.techniqueRepository.findOne({
        where: { key: techniqueData.key, locale: techniqueData.locale }
      });

      if (!existing) {
        const technique = this.techniqueRepository.create(techniqueData);
        await this.techniqueRepository.save(technique);
      }
    }
  }
}