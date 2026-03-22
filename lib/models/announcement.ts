import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  text: string;
  isActive: boolean;
  order: number;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export default Announcement;
