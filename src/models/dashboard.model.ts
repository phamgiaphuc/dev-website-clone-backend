import mongoose, { Schema } from "mongoose";

const dashboardSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Users'
  },
  followingUsers: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Users',
    }],
    default: []
  }
},
{
  timestamps: true
}); 

export const DashboardModel = mongoose.model('Dashboards', dashboardSchema);