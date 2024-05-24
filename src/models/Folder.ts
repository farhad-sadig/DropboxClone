import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFolder extends Document {
	userId: mongoose.Schema.Types.ObjectId;
	name: string;
	subFolders: mongoose.Types.ObjectId[];
	parentFolderId?: mongoose.Schema.Types.ObjectId;
}

const folderSchema: Schema<IFolder> = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	name: { type: String, required: true },
	subFolders: [{ type: mongoose.Types.ObjectId, ref: "Folder" }],
	parentFolderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Folder",
		default: null
	}
});

const Folder: Model<IFolder> =
	mongoose.models.Folder || mongoose.model("Folder", folderSchema);

export default Folder;
