import mongoose, { Schema, Document, UpdateQuery } from "mongoose";
import { IItem, ItemSchema } from "../../item/item.schema";

interface IListDetails extends Document {
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

// Middleware for update (findOneAndUpdate, updateOne)
ListDetailsSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update) {
    return next();
  }
  const itemsToUpdate =
    (update as UpdateQuery<any> & { $set?: { items: any[] } }).$set?.items ||
    [];

  const list = await this.model.findOne(this.getQuery());
  if (!list) {
    return next();
  }
  const privacy = list.privacy;

  if (privacy === "statusBased") {
    itemsToUpdate.forEach((item: any) => {
      if (item.userRating) {
        item.invalidate(
          "userRating",
          "userRating is not allowed for statusBased lists"
        );
      }
    });
  }
  if (privacy === "themeBased") {
    itemsToUpdate.forEach((item: any) => {
      if (item.anticipation) {
        item.invalidate(
          "anticipation",
          "anticipation is not allowed for themeBased lists"
        );
      }
    });
  }
  next();
});

export default mongoose.model<IListDetails>("List", ListDetailsSchema);
export type { IListDetails };
