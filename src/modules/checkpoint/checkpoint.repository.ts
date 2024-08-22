import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { CheckpointType } from '@/types';
import { Checkpoint } from './schemas/checkpoints.schema';
import { check } from 'prettier';

@Injectable()
export default class CheckpointRepository {
  constructor(
    @InjectModel(Checkpoint.name) private CheckpointModel: Model<Checkpoint>,
  ) {}

  public async create(checkpoint: CheckpointType): Promise<Checkpoint> {
    const newCheckpoint: Checkpoint =
      await this.CheckpointModel.create<CheckpointType>({
        ...checkpoint,
      });

    return newCheckpoint;
  }

  public async createMultiple(checkpoints: CheckpointType[]) {
    const { insertedIds } =
      await this.CheckpointModel.collection.insertMany(checkpoints);
    return insertedIds;
  }

  public async getLastCheckpoint(): Promise<Checkpoint | null> {
    const checkpoint = await this.CheckpointModel.findOne({})
      .sort({ createdAt: 'desc' })
      .exec();

    return checkpoint;
  }
}
