import { ClientSession, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

import { FuelBlockWithUtxosType } from '@/types';
import { FuelBlockWithUtxos } from './schemas/utxo.schema';

@Injectable()
export default class UtxoRepository {
  constructor(
    @InjectModel(FuelBlockWithUtxos.name)
    private FuelBlockWithUtxoModel: Model<FuelBlockWithUtxos>,
  ) {}

  async create(
    blockData: FuelBlockWithUtxosType,
    session?: ClientSession,
  ): Promise<FuelBlockWithUtxos> {
    const [newEntry] = await this.FuelBlockWithUtxoModel.create(
      [{ ...blockData }],
      { session },
    );

    return newEntry;
  }

  async findAll(): Promise<FuelBlockWithUtxos[]> {
    return this.FuelBlockWithUtxoModel.find().exec();
  }

  async findOne(height: number): Promise<FuelBlockWithUtxos | null> {
    return this.FuelBlockWithUtxoModel.findOne({ height }).exec();
  }

  async update(
    height: number,
    blockData: Partial<FuelBlockWithUtxosType>,
    session?: ClientSession,
  ): Promise<FuelBlockWithUtxos | null> {
    return this.FuelBlockWithUtxoModel.findOneAndUpdate({ height }, blockData, {
      session,
      new: true,
    }).exec();
  }

  async delete(
    height: number,
    session?: ClientSession,
  ): Promise<FuelBlockWithUtxos | null> {
    return this.FuelBlockWithUtxoModel.findOneAndDelete(
      { height },
      { session },
    ).exec();
  }
}
