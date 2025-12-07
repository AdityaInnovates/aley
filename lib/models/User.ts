import mongoose from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  preferences?: {
    darkMode: boolean;
    notifications: boolean;
  };
  plan?: string;
  status?: string;
  memberSince?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PreferencesSchema = new mongoose.Schema(
  {
    darkMode: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
      default: "",
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [400, "Bio cannot exceed 400 characters"],
      default: "",
    },
    preferences: {
      type: PreferencesSchema,
      default: () => ({ darkMode: false, notifications: true }),
    },
    plan: {
      type: String,
      default: "Free",
    },
    status: {
      type: String,
      default: "active",
    },
    memberSince: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
