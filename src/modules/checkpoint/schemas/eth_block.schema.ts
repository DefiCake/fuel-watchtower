import { EthBlockType } from '@/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class EthBlock extends Document implements EthBlockType {
  @Prop({ required: true, type: String, unique: true })
  hash = '';

  @Prop({ required: true, type: Number, unique: true })
  number = 0;

  @Prop({ required: true, type: Number })
  timestamp = 0;
}

export type EthBlockDocument = EthBlock & Document;

export const EthBlockSchema = SchemaFactory.createForClass(EthBlock)
  .set('versionKey', false)
  .set('strict', true);
