import { FuelBlockType } from '@/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class FuelBlock extends Document implements FuelBlockType {
  @Prop({ required: true, type: String, unique: true })
  id = '';

  @Prop({ required: true, type: Number, unique: true })
  height = 0;

  @Prop({ required: true, type: Number })
  time = 0;

  @Prop({ required: true, type: Number })
  ethBlockSync = 0;
}

export type FuelBlockDocument = FuelBlock & Document;

export const FuelBlockSchema = SchemaFactory.createForClass(FuelBlock).set(
  'versionKey',
  false,
);
