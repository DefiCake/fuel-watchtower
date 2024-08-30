import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { EthL1L2Messages } from './schemas/eth.l1l2.messages.schema';
import { L1toL2MessageType } from '@/types';

@Injectable()
export default class EthL1L2MessagesRepository {
  constructor(
    @InjectModel(EthL1L2Messages.name)
    private EthL1L2Model: Model<EthL1L2Messages>,
  ) {}

  async create(
    entry: L1toL2MessageType,
    session?: ClientSession,
  ): Promise<EthL1L2Messages> {
    const [newEntry] = await this.EthL1L2Model.create([{ ...entry }], {
      session,
    });

    return newEntry;
  }

  async createMany(entries: L1toL2MessageType[], session?: ClientSession) {
    const newEntries = await this.EthL1L2Model.create(entries, {
      session,
    });

    return newEntries;
  }

  async findAll(): Promise<EthL1L2Messages[]> {
    return this.EthL1L2Model.find().exec();
  }

  async findOne(nonce: string): Promise<EthL1L2Messages | null> {
    return this.EthL1L2Model.findOne({ nonce }).exec();
  }

  async findLastIndexedBlock(): Promise<number | null> {
    const event = await this.EthL1L2Model.findOne()
      .sort({ blockNumber: 'desc' })
      .exec();

    return typeof event?.blockNumber === 'number' ? event.blockNumber : null;
  }

  async update(
    nonce: string,
    entry: Partial<L1toL2MessageType>,
    session?: ClientSession,
  ): Promise<EthL1L2Messages | null> {
    return this.EthL1L2Model.findOneAndUpdate({ nonce }, entry, {
      session,
      new: true,
    }).exec();
  }

  async delete(
    nonce: string,
    session?: ClientSession,
  ): Promise<EthL1L2Messages | null> {
    return this.EthL1L2Model.findOneAndDelete({ nonce }, { session }).exec();
  }
}
