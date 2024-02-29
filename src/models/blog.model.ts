import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  cover_image: {
    type: String,
    required: true
  },
  content: {
    type: Object,
    requried: true
  },
  tags: {
    type: [{
      value: {
        type: String
      },
      color: {
        type: String
      }
    }],
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Users'
  },
  reactions: {
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    }
  },
  comments: {
    type: Schema.Types.ObjectId,
    ref: 'comments'
  },
  draft: {
    type: Boolean,
    default: false
  },
  publish: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
  }
});

export const BlogModel = mongoose.model('blogs', blogSchema);