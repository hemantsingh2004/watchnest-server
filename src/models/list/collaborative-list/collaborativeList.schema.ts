import mongoose, { Schema } from "mongoose";
import { IItem, ItemSchema } from "../../item/item.schema.ts";

// This Schema is not final yet, and will be updated later

interface ICollaborativeList {
  items: IItem[];
  users: mongoose.Types.ObjectId[];
  addedAt: Date;
  updatedAt: Date;
}

const CollaborativeListSchema: Schema = new Schema({
  items: [ItemSchema],
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  addedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICollaborativeList>(
  "CollaborativeList",
  CollaborativeListSchema
);
