import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFile extends Document {
	userId: mongoose.Schema.Types.ObjectId;
	filename: string;
	url: string;
	size?: number;
	createdAt?: Date;
}

const FileSchema: Schema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
	filename: { type: String, required: true },
	url: { type: String, required: true },
	size: { type: Number },
	createdAt: { type: Date, default: Date.now }
});

const File: Model<IFile> =
	mongoose.models.File || mongoose.model<IFile>("File", FileSchema);
export default File;
