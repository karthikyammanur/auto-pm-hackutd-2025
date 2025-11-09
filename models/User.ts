import mongoose, { Schema, Document, Model } from 'mongoose';

// Reddit API Integration Interface
interface IRedditAuth {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scope?: string;
}

interface IJiraAuth {
  // OAuth 2.0 (3LO) - Modern authentication method
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scopes?: string[];
  cloudId?: string; // Atlassian cloud ID for API requests
}

interface IGoogleAuth {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scopes?: string[];
  email?: string; // Google account email
}

export interface IUser extends Document {
  username: string;
  firstName: string;
  email: string;
  sub: string;
  dateOfBirth?: Date;

  redditAuth?: IRedditAuth;
  jiraAuth?: IJiraAuth;
  googleAuth?: IGoogleAuth;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isRedditTokenExpired(): boolean;
  isJiraTokenExpired(): boolean;
  isGoogleTokenExpired(): boolean;
}

const RedditAuthSchema = new Schema<IRedditAuth>({
  accessToken: {
    type: String,
    select: false,
  },
  refreshToken: {
    type: String,
    select: false,
  },
  tokenExpiry: {
    type: Date,
  },
  scope: {
    type: String,
    default: 'read,identity',
  },
}, { _id: false });

const JiraAuthSchema = new Schema<IJiraAuth>({
  // OAuth 2.0 (3LO) fields
  accessToken: {
    type: String,
    select: false, // Don't include by default for security
  },
  refreshToken: {
    type: String,
    select: false, // Don't include by default for security
  },
  tokenExpiry: {
    type: Date,
  },
  scopes: [{
    type: String,
  }],
  cloudId: {
    type: String,
  }
}, { _id: false });

const GoogleAuthSchema = new Schema<IGoogleAuth>({
  accessToken: {
    type: String,
    select: false, // Don't include by default for security
  },
  refreshToken: {
    type: String,
    select: false, // Don't include by default for security
  },
  tokenExpiry: {
    type: Date,
  },
  scopes: [{
    type: String,
  }],
  email: {
    type: String,
  }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  sub: {
    type: String,
    required: [true, 'OAuth sub is required'],
    unique: true,
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past',
    },
  },
  redditAuth: {
    type: RedditAuthSchema,
    default: undefined,
  },
  jiraAuth: {
    type: JiraAuthSchema,
    default: undefined,
  },
  googleAuth: {
    type: GoogleAuthSchema,
    default: undefined,
  },
}, {
  timestamps: true,
  collection: 'users',
});
UserSchema.methods = {
  isRedditTokenExpired(): boolean {
    if (!this.redditAuth?.tokenExpiry) return true;
    return new Date() > this.redditAuth.tokenExpiry;
  },

  isJiraTokenExpired(): boolean {
    if (!this.jiraAuth?.tokenExpiry) return true;
    return new Date() > this.jiraAuth.tokenExpiry;
  },

  isGoogleTokenExpired(): boolean {
    if (!this.googleAuth?.tokenExpiry) return true;
    return new Date() > this.googleAuth.tokenExpiry;
  },
};

UserSchema.statics = {
  findBySub(sub: string) {
    return this.findOne({ sub });
  },
  findByEmail(email: string) {
    return this.findOne({ email: email.toLowerCase() });
  },
};

UserSchema.pre('save', function(next) {
  next();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;