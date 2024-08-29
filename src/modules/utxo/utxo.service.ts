import { Injectable } from '@nestjs/common';
import { ClientSession, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import UtxoRepository from './utxo.repository';
import { FuelBlockWithUtxosType } from '@/types';

@Injectable()
export class UtxoService {
  constructor(
    private readonly utxoRepository: UtxoRepository,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async insertUtxos(block: FuelBlockWithUtxosType, session?: ClientSession) {
    return this.utxoRepository.create(block, session);
  }

  async getUtxos(height: number): Promise<FuelBlockWithUtxosType | null> {
    if (height === 0) {
      const utxos: FuelBlockWithUtxosType = {
        height: 0,
        utxos: [],
      };
      return utxos;
    }

    return this.utxoRepository.findOne(height);
  }

  async startSession(): Promise<ClientSession> {
    const session = await this.connection.startSession();
    return session;
  }
}
