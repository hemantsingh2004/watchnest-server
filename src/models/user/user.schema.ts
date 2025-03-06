import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password: string;
  profileType: string;
  refreshToken?: string;
  avatar?: string;
  list?: {
    statusBased: mongoose.Types.ObjectId[];
    themeBased: mongoose.Types.ObjectId[];
  };
  tags?: string[];
  friendRequests?: mongoose.Types.ObjectId[];
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
    profileType: { type: String, enum: ["public", "private"], required: true },
    refreshToken: { type: String },
    avatar: { type: String }, // stores path to avatar image from backend folder
    list: {
      statusBased: [{ type: Schema.Types.ObjectId, ref: "List" }],
      themeBased: [{ type: Schema.Types.ObjectId, ref: "List" }],
    },
    tags: [{ type: String }],
    friendRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
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

const userModel = mongoose.model<IUser>("User", UserSchema);
export default userModel;
export type { IUser };
