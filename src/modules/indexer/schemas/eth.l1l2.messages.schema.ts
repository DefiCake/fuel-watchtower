import { L1toL2MessageType } from '@/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class EthL1L2Messages extends Document implements L1toL2MessageType {
  @Prop({ required: true })
  blockNumber: number = 0;
  @Prop({ required: true })
  sender: string = '';
  @Prop({ required: true })
  recipient: string = '';
  @Prop({ required: true, unique: true })
  nonce: string = '';
  @Prop({ required: true })
  amount: string = '';
  @Prop({ required: true })
  data: string = '';
}

export type EthL1L2MessagesDocument = EthL1L2Messages & Document;

export const EthL1L2MessagesSchema = SchemaFactory.createForClass(
  EthL1L2Messages,
).set('versionKey', false);
