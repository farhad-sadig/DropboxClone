import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFolder extends Document {
	userId: mongoose.Schema.Types.ObjectId;
	name: string;
	parentFolderId?: mongoose.Schema.Types.ObjectId;
}

const folderSchema: Schema<IFolder> = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	name: { type: String, required: true },
	parentFolderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Folder",
		default: null
	}
});

const Folder: Model<IFolder> =
	mongoose.models.Folder || mongoose.model("Folder", folderSchema);

export default Folder;
