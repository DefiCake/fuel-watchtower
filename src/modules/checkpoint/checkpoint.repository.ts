import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { CheckpointType } from '@/types';
import { Checkpoint } from './schemas/checkpoints.schema';

@Injectable()
export default class CheckpointRepository {
  constructor(
    @InjectModel(Checkpoint.name) private CheckpointModel: Model<Checkpoint>,
  ) {}

  public async create(
    checkpoint: CheckpointType,
    session?: ClientSession,
  ): Promise<Checkpoint> {
    const [newCheckpoint] = await this.CheckpointModel.create(
      [{ ...checkpoint }],
      {
        session,
      },
    );

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
