import mongoose, { Schema, Model, Document } from 'mongoose'

export interface IConfig extends Document {
  key: string
  value: string
  updatedAt: Date
}

const ConfigSchema = new Schema<IConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
)

export const Config: Model<IConfig> =
  mongoose.models.Config || mongoose.model<IConfig>('Config', ConfigSchema)
