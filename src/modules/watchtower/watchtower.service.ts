import { FuelService } from '@/modules/fuel/fuel.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WatchtowerService {
  constructor(private readonly fuelService: FuelService) {}
  async getFuelLastBlock() {
    return this.fuelService.getLastBlock();
  }
}
