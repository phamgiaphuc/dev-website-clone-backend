import mongoose, { Schema } from "mongoose";
import BlogDocument from "../props/blog.props";

const blogSchema = new Schema<BlogDocument>({
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
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'Users'
    }],
    comments: [{
      type: Schema.Types.ObjectId,
      ref: 'Comments'
    }]
  },
  draft: {
    type: Boolean,
    default: false
  },
  publish: {
    type: Boolean,
    default: false
  },
},
{
  timestamps: true
});

export const BlogModel = mongoose.model('blogs', blogSchema);