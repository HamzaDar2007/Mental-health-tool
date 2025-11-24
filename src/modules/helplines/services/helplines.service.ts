import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Helpline, HelplineType } from '../entities/helpline.entity';
import { CreateHelplineDto, GetHelplinesDto } from '../../../common/dtos/helpline.dto';

@Injectable()
export class HelplinesService {
  constructor(
    @InjectRepository(Helpline)
    private helplineRepository: Repository<Helpline>
  ) {}

  async create(createHelplineDto: CreateHelplineDto): Promise<Helpline> {
    const helpline = this.helplineRepository.create(createHelplineDto);
    return await this.helplineRepository.save(helpline);
  }

  async findByCountry(getHelplinesDto: GetHelplinesDto): Promise<Helpline[]> {
    const query = this.helplineRepository.createQueryBuilder('helpline')
      .where('helpline.country = :country', { country: getHelplinesDto.country })
      .andWhere('helpline.active = :active', { active: true });

    if (getHelplinesDto.region) {
      query.andWhere('(helpline.region = :region OR helpline.region IS NULL)', { 
        region: getHelplinesDto.region 
      });
    }

    if (getHelplinesDto.type) {
      query.andWhere('helpline.type = :type', { type: getHelplinesDto.type });
    }

    return await query
      .orderBy('helpline.priority', 'ASC')
      .addOrderBy('helpline.type', 'ASC')
      .getMany();
  }

  async findCrisisHelplines(countryCode: string, region?: string): Promise<Helpline[]> {
    const query = this.helplineRepository.createQueryBuilder('helpline')
      .where('helpline.country = :countryCode', { countryCode })
      .andWhere('helpline.active = :active', { active: true })
      .andWhere('helpline.type IN (:...types)', { 
        types: [HelplineType.EMERGENCY, HelplineType.SUICIDE] 
      });

    if (region) {
      query.andWhere('(helpline.region = :region OR helpline.region IS NULL)', { region });
    }

    return await query
      .orderBy('helpline.priority', 'ASC')
      .getMany();
  }

  async findAll(): Promise<Helpline[]> {
    return await this.helplineRepository.find({
      where: { active: true },
      order: { country: 'ASC', priority: 'ASC' }
    });
  }

  async update(id: string, updateData: Partial<Helpline>): Promise<Helpline> {
    await this.helplineRepository.update(id, updateData);
    const helpline = await this.helplineRepository.findOne({ where: { id } });
    if (!helpline) {
      throw new Error('Helpline not found');
    }
    return helpline;
  }

  async remove(id: string): Promise<void> {
    await this.helplineRepository.update(id, { active: false });
  }

  async seedDefaultHelplines(): Promise<void> {
    const defaultHelplines = [
      {
        country: 'US',
        type: HelplineType.SUICIDE,
        description: 'US National Suicide Prevention Lifeline',
        phone: '988',
        priority: 1,
        metadata: { url: 'https://988lifeline.org/', hours: '24/7' }
      },
      {
        country: 'US',
        type: HelplineType.EMERGENCY,
        description: 'Emergency Services',
        phone: '911',
        priority: 1,
        metadata: { hours: '24/7' }
      },
      {
        country: 'PK',
        type: HelplineType.SUICIDE,
        description: 'Pakistan Mental Health Helpline',
        phone: '021-111-222-333',
        priority: 1,
        metadata: { hours: '9-5 Mon-Fri' }
      },
      {
        country: 'GB',
        type: HelplineType.SUICIDE,
        description: 'Samaritans',
        phone: '116 123',
        priority: 1,
        metadata: { url: 'https://www.samaritans.org/', hours: '24/7' }
      },
      {
        country: 'CA',
        type: HelplineType.SUICIDE,
        description: 'Canada Suicide Prevention Service',
        phone: '1-833-456-4566',
        priority: 1,
        metadata: { hours: '24/7' }
      }
    ];

    for (const helplineData of defaultHelplines) {
      const existing = await this.helplineRepository.findOne({
        where: { 
          country: helplineData.country,
          phone: helplineData.phone 
        }
      });

      if (!existing) {
        const helpline = this.helplineRepository.create(helplineData);
        await this.helplineRepository.save(helpline);
      }
    }
  }
}