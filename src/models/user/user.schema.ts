import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  refreshToken: string;
  profileType: string;
  avatar?: string;
  list?: {
    statusBased: mongoose.Types.ObjectId[];
    themeBased: mongoose.Types.ObjectId[];
  };
  tags?: string[];
  friends?: mongoose.Types.ObjectId[];
  sharedLists?: [
    {
      list: mongoose.Types.ObjectId;
      sharedBy?: mongoose.Types.ObjectId;
      sharedTo?: mongoose.Types.ObjectId;
    }
  ];
  collaborativeLists?: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    profileType: { type: String, enum: ["public", "private"], required: true },
    avatar: { type: String }, // stores path to avatar image from backend folder
    list: {
      statusBased: [{ type: Schema.Types.ObjectId, ref: "List" }],
      themeBased: [{ type: Schema.Types.ObjectId, ref: "List" }],
    },
    tags: [{ type: String }],
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    sharedLists: [
      {
        list: { type: Schema.Types.ObjectId, ref: "List", required: true },
        sharedBy: { type: Schema.Types.ObjectId, ref: "User" },
        sharedTo: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    collaborativeLists: [
      { type: Schema.Types.ObjectId, ref: "CollaborativeList" },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
