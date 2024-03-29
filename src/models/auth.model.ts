import { REFRESH_COOKIE_LIFE } from "../configs/environment";
import mongoose, { Schema } from "mongoose";

const authSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Users'
  },
  refreshToken: {
    type: String,
    required: true
  },
  expiredAt: {
    type: Date,
    expires: +REFRESH_COOKIE_LIFE * 60,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date.toISOString();
    }
  }
});

export const AuthModel = mongoose.model('Auths', authSchema);