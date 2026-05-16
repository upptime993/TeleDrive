import mongoose, { Schema, Model, Document, Types } from 'mongoose'

export interface IShareLink extends Document {
  token: string
  fileId: Types.ObjectId
  userId: Types.ObjectId
  fileName: string
  fileSize: number
  mimeType: string
  downloadCount: number
  expiresAt: Date | null
  createdAt: Date
}

const ShareLinkSchema = new Schema<IShareLink>(
  {
    token: { type: String, required: true, unique: true, index: true },
    fileId: { type: Schema.Types.ObjectId, ref: 'File', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    downloadCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
)

ShareLinkSchema.index({ fileId: 1 })
ShareLinkSchema.index({ userId: 1 })
ShareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true })

export const ShareLink: Model<IShareLink> =
  mongoose.models.ShareLink || mongoose.model<IShareLink>('ShareLink', ShareLinkSchema)
