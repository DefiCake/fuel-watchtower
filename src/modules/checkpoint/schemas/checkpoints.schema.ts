import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EthBlockSchema } from './eth_block.schema';
import { EthBlockType, CheckpointType, FuelBlockType } from '@/types';
import { FuelBlockSchema } from './fuel_block.schema';

@Schema()
export class Checkpoint extends Document implements CheckpointType {
  @Prop({ required: true, type: EthBlockSchema })
  eth_block: EthBlockType;

  @Prop({ required: true, type: FuelBlockSchema })
  fuel_block: FuelBlockType;

  @Prop({
    type: Number,
    required: true,
    default: () => Math.floor(Date.now() / 1000),
  })
  createdAt: number;
}

export type CheckpointDocument = Checkpoint & Document;

export const CheckpointSchema = SchemaFactory.createForClass(Checkpoint)
  .set('versionKey', false)
  .set('strict', true);
