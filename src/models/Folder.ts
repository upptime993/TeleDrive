import mongoose, { Schema, Model, Document, Types } from 'mongoose'

export interface IFolder extends Document {
  userId: Types.ObjectId
  name: string
  parentId: Types.ObjectId | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

const FolderSchema = new Schema<IFolder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Folder: Model<IFolder> =
  mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema)
