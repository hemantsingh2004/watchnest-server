import { Schema } from "mongoose";

interface IItem {
  mediaId: string;
  title: string;
  information: {
    createdAt: Date;
    updatedAt?: Date;
    rating?: number;
    ageRating: string;
    posterImage: string;
    coverImage?: string;
    genres?: string[];
  };
  customNotes?: string;
  tags?: string[];
  userRating?: number;
  anticipation?: number;
  sortOrder?: number;
}

const ItemSchema: Schema = new Schema({
  mediaId: { type: String, required: true },
  title: { type: String },
  information: {
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date },
    rating: { type: Number },
    ageRating: { type: String },
    posterImage: { type: String, required: true },
    coverImage: { type: String },
    genres: [{ type: String }],
  },
  customNotes: { type: String },
  tags: [{ type: String }],
  userRating: { type: Number },
  anticipation: { type: Number },
  sortOrder: { type: Number },
});

export type { IItem };
export { ItemSchema };
