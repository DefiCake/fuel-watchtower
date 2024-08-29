import { FuelBlockWithUtxosType } from '@/types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class FuelBlockWithUtxos
  extends Document
  implements FuelBlockWithUtxosType
{
  @Prop({ required: true, type: Number, unique: true })
  height = 0;

  @Prop({
    required: true,
    type: [String],
    validate: {
      validator: (v: string[]) =>
        v.every((item) => {
          try {
            BigInt(item);
            return true;
          } catch {
            return false;
          }
        }),
      message: 'All elements in utxos must be convertible to BigInt',
    },
  })
  utxos: string[] = [];
}

export type FuelBlockWithUtxosDocument = FuelBlockWithUtxos & Document;

export const FuelBlockWithUtxosSchema = SchemaFactory.createForClass(
  FuelBlockWithUtxos,
).set('versionKey', false);
