import mongoose, { Schema } from "mongoose";
import { IItem, ItemSchema } from "../../item/item.schema";

interface IListDetails {
  items?: IItem[];
  privacy: string;
  type: string;
  addedAt: Date;
  updatedAt: Date;
}

const ListDetailsSchema: Schema = new Schema({
  items: [ItemSchema],
  privacy: { type: String, enum: ["public", "private"], required: true },
  type: { type: String, enum: ["statusBased", "themeBased"], required: true },
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IListDetails>("List", ListDetailsSchema);
export type { IListDetails };
