import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FuelBlockWithUtxos,
  FuelBlockWithUtxosSchema,
} from './schemas/utxo.schema';
import { UtxoService } from './utxo.service';
import UtxoRepository from './utxo.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FuelBlockWithUtxos.name,
        schema: FuelBlockWithUtxosSchema,
      },
    ]),
  ],
  providers: [ConfigService, UtxoRepository, UtxoService],
  exports: [UtxoService],
})
export default class UtxoModule {}
