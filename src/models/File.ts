import mongoose, { Schema, Model, Document, Types } from 'mongoose'

export interface IChunk {
  part: number
  msgId: number
  size: number
}

export interface IFile extends Document {
  userId: Types.ObjectId
  name: string
  originalName: string
  size: number
  mimeType: string
  folderId: Types.ObjectId | null
  isChunked: boolean
  isStarred: boolean
  telegramFileId: string | null
  telegramMsgId: number | null
  chunks: IChunk[]
  createdAt: Date
  updatedAt: Date
}

const ChunkSchema = new Schema<IChunk>(
  {
    part: { type: Number, required: true },
    msgId: { type: Number, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
)

const FileSchema = new Schema<IFile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    originalName: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    mimeType: { type: String, required: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    isChunked: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    telegramFileId: { type: String, default: null },
    telegramMsgId: { type: Number, default: null },
    chunks: { type: [ChunkSchema], default: [] },
  },
  { timestamps: true }
)

// Compound indexes for fast queries
FileSchema.index({ userId: 1, folderId: 1 })
FileSchema.index({ userId: 1, createdAt: -1 })
FileSchema.index({ userId: 1, name: 'text' })

export const File: Model<IFile> =
  mongoose.models.File || mongoose.model<IFile>('File', FileSchema)
