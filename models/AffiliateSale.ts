import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAffiliateSale extends Document {
  courseId: Types.ObjectId;
  buyerId: Types.ObjectId; // The student that made the purchase
  affiliateId: Types.ObjectId; // The affiliate who referred the sale
  amount: number; // Sale amount
  commission: number; // Amount the affiliate earns
  saleDate: Date;
  paymentStatus: 'pending' | 'paid'; // Whether affiliate has been paid
}

const AffiliateSaleSchema = new Schema<IAffiliateSale>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  affiliateId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  commission: {
    type: Number,
    required: true,
  },
  saleDate: {
    type: Date,
    default: Date.now,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
});

export default mongoose.model<IAffiliateSale>('AffiliateSale', AffiliateSaleSchema);
