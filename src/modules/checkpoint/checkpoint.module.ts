import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FuelService } from '../fuel/fuel.service';
import { CheckpointService } from './checkpoint.service';
import { EthService } from '../eth/eth.service';
import CheckpointRepository from './checkpoint.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Checkpoint, CheckpointSchema } from './schemas/checkpoints.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Checkpoint.name,
        schema: CheckpointSchema,
      },
    ]),
  ],
  providers: [
    ConfigService,
    FuelService,
    EthService,
    CheckpointRepository,
    CheckpointService,
  ],
  exports: [CheckpointService],
})
export default class CheckpointModule {}
