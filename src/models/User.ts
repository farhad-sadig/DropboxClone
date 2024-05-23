import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
	clerkId: string;
	email: string;
	name?: string;
}

const UserSchema: Schema = new Schema({
	clerkId: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	name: { type: String }
});

const User: Model<IUser> =
	mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
