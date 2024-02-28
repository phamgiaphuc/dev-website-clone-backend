import mongoose, { Schema } from 'mongoose';
import { emailRegex } from '../utils/regexVars';

const profile_imgs_name_list = ["Garfield", "Tinkerbell", "Annie", "Loki", "Cleo", "Angel", "Bob", "Mia", "Coco", "Gracie", "Bear", "Bella", "Abby", "Harley", "Cali", "Leo", "Luna", "Jack", "Felix", "Kiki"];
const profile_imgs_collections_list = ["notionists-neutral", "adventurer-neutral", "fun-emoji"];

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    validate: [() => {
      emailRegex.test('{VALUE}');
    }, 'Email is invalid.']
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'user'
  },
  verification: {
    is_verified: {
      type: Boolean,
      default: function() {
        return this.google_auth ? true : false
      }
    },
    verified_code: {
      type: String,
      default: ''
    }
  },
  google_auth: {
    type: Boolean,
    default: false
  },
  profile: {
    fullname: {
      type: String,
      required: true,
      minLength: [3, 'Full name must be 3 characters long.']
    },
    username: {
      type: String,
      required: true
    },
    bio: {
      type: String,
      maxLength: [250, 'Bio should not be more than 250 letters.'],
      default: ''
    },
    address: {
      type: String,
      maxLength: [100, 'Address should not be more than 100 letters.'],
      default: ''
    },
    phone_number: {
      type: String,
      maxLength: [10, 'Phone should not be more than 10 letters.'],
      default: ''
    },
    profile_img: {
      type: String,
      required: true,
      default: () => {
        return `https://api.dicebear.com/6.x/${profile_imgs_collections_list[Math.floor(Math.random() * profile_imgs_collections_list.length)]}/svg?seed=${profile_imgs_name_list[Math.floor(Math.random() * profile_imgs_name_list.length)]}`
      }
    },
    branding_color: {
      type: String,
      maxLength: 7,
      default: '#000000'
    },
    social_links: {
      youtube: {
        type: String,
        default: ''
      },
      instagram: {
          type: String,
          default: "",
      },
      facebook: {
          type: String,
          default: "",
      },
      twitter: {
          type: String,
          default: "",
      },
      github: {
          type: String,
          default: "",
      },
      website: {
          type: String,
          default: "",
      }
    },
  },
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

export const UserModel = mongoose.model('Users', userSchema);