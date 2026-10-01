import mongoose from 'mongoose';

const { Schema } = mongoose;

// ─── User ─────────────────────────────────────────────────────────────────────
const userSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  privacy: {
    emailPrivacy: { type: String, default: 'contacts' },
    lastSeenPrivacy: { type: String, default: 'everyone' },
    profilePhotoPrivacy: { type: String, default: 'everyone' },
    onlineStatusPrivacy: { type: String, default: 'everyone' },
    whoCanMessage: { type: String, default: 'everyone' },
    readReceiptsEnabled: { type: Boolean, default: true },
  },
  security: {
    appLockPinHash: { type: String, default: '' },
    autoLockMinutes: { type: Number, default: 0 },
    notificationPrivacy: { type: String, default: 'preview' },
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    approxLocationName: { type: String, default: '' },
    updatedAt: { type: Date },
  },
}, { timestamps: true });

// ─── Session ──────────────────────────────────────────────────────────────────
const sessionSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String, ref: 'User', required: true },
  deviceName: { type: String, default: 'Web Browser' },
  platform: { type: String, default: 'Desktop / Mobile Web' },
  ipAddress: { type: String, default: '' },
  token: { type: String, unique: true, required: true },
  lastActive: { type: Date, default: Date.now },
}, { timestamps: true });

// ─── Contact ──────────────────────────────────────────────────────────────────
const contactSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String, ref: 'User', required: true },
  contactId: { type: String, ref: 'User', required: true },
  alias: { type: String, default: '' },
}, { timestamps: true });
contactSchema.index({ userId: 1, contactId: 1 }, { unique: true });

// ─── Blocked User ─────────────────────────────────────────────────────────────
const blockedUserSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  userId: { type: String, ref: 'User', required: true },
  blockedUserId: { type: String, ref: 'User', required: true },
}, { timestamps: true });
blockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

// ─── Chat Room ────────────────────────────────────────────────────────────────
const chatRoomSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  type: { type: String, enum: ['direct', 'group', 'private', 'secret'], required: true },
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  description: { type: String, default: '' },
  createdBy: { type: String, ref: 'User', required: true },
}, { timestamps: true });

// ─── Chat Member ──────────────────────────────────────────────────────────────
const chatMemberSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  roomId: { type: String, ref: 'ChatRoom', required: true },
  userId: { type: String, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  isPinned: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  customBackground: { type: String, default: '' },
}, { timestamps: true });
chatMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

// ─── Message ──────────────────────────────────────────────────────────────────
const messageSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  roomId: { type: String, ref: 'ChatRoom', required: true },
  senderId: { type: String, ref: 'User', required: true },
  type: { type: String, default: 'text' },
  content: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  mediaMeta: { type: Schema.Types.Mixed, default: {} },
  replyToId: { type: String, ref: 'Message', default: null },
  isDisappearing: { type: Boolean, default: false },
  disappearingSeconds: { type: Number, default: 0 },
  isViewOnce: { type: Boolean, default: false },
  isConsumed: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  reactions: [{
    userId: String,
    emoji: String,
  }],
  reads: [{ type: String }], // array of userIds
}, { timestamps: true });
messageSchema.index({ roomId: 1, createdAt: 1 });

// ─── Report ───────────────────────────────────────────────────────────────────
const reportSchema = new Schema({
  _id: { type: String, default: () => crypto.randomUUID() },
  reporterId: { type: String, ref: 'User', required: true },
  reportedUserId: { type: String, ref: 'User', required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' },
}, { timestamps: true });

// ─── Exports ──────────────────────────────────────────────────────────────────
export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const Contact = mongoose.model('Contact', contactSchema);
export const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);
export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export const ChatMember = mongoose.model('ChatMember', chatMemberSchema);
export const Message = mongoose.model('Message', messageSchema);
export const Report = mongoose.model('Report', reportSchema);
