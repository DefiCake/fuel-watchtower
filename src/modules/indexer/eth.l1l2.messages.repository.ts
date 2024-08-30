import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { EthL1L2Messages } from './schemas/eth.l1l2.messages.schema';
import { L1toL2MessageType } from '@/types';

@Injectable()
export default class EthL1L2MessagesRepository {
  constructor(
    @InjectModel(EthL1L2Messages.name)
    private FuelBlockWithUtxoModel: Model<EthL1L2Messages>,
  ) {}

  async create(
    entry: L1toL2MessageType,
    session?: ClientSession,
  ): Promise<EthL1L2Messages> {
    const [newEntry] = await this.FuelBlockWithUtxoModel.create(
      [{ ...entry }],
      { session },
    );

    return newEntry;
  }

  async createMany(entries: L1toL2MessageType[], session?: ClientSession) {
    const newEntries = await this.FuelBlockWithUtxoModel.create(entries, {
      session,
    });

    return newEntries;
  }

  async findAll(): Promise<EthL1L2Messages[]> {
    return this.FuelBlockWithUtxoModel.find().exec();
  }

  async findOne(height: number): Promise<EthL1L2Messages | null> {
    return this.FuelBlockWithUtxoModel.findOne({ height }).exec();
  }

  async update(
    height: number,
    entry: Partial<L1toL2MessageType>,
    session?: ClientSession,
  ): Promise<EthL1L2Messages | null> {
    return this.FuelBlockWithUtxoModel.findOneAndUpdate({ height }, entry, {
      session,
      new: true,
    }).exec();
  }

  async delete(
    height: number,
    session?: ClientSession,
  ): Promise<EthL1L2Messages | null> {
    return this.FuelBlockWithUtxoModel.findOneAndDelete(
      { height },
      { session },
    ).exec();
  }
}
