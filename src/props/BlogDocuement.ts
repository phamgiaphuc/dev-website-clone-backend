import { Document, Schema } from 'mongoose';

interface BlogTag {
  value: string;
  color: string;
}

interface BlogReactions {
  likes: Schema.Types.ObjectId[];
  comments: Schema.Types.ObjectId[];
}

interface BlogDocument extends Document {
  title: string;
  cover_image: string;
  content: object;
  tags: BlogTag[];
  author: Schema.Types.ObjectId;
  reactions: BlogReactions;
  draft: boolean;
  publish: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default BlogDocument;
