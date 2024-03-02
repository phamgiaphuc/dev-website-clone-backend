import { Document, Schema } from 'mongoose';

interface UserDocument extends Document {
  email: string;
  password: string;
  role: string;
  verification: {
    is_verified: boolean;
    verified_code: string;
  };
  google_auth: boolean;
  profile: {
    fullname: string;
    username: string;
    bio: string;
    address: string;
    profile_img: string;
    branding_color: string;
    social_links: {
      youtube: string;
      instagram: string;
      facebook: string;
      twitter: string;
      github: string;
      website: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export default UserDocument;