import mongoose, { ConnectOptions } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
	throw new Error(
		"Please define the MONGODB_URI environment variable inside .env.local"
	);
}
interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	namespace NodeJS {
		interface Global {
			mongooseCache: MongooseCache;
		}
	}
}

const globalWithCache = global as typeof global & {
	mongooseCache?: MongooseCache;
};

let cached: MongooseCache = globalWithCache.mongooseCache || {
	conn: null,
	promise: null
};

if (!globalWithCache.mongooseCache) {
	globalWithCache.mongooseCache = cached;
}
const dbConnect = async () => {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts: ConnectOptions = {};

		cached.promise = mongoose
			.connect(MONGODB_URI, opts)
			.then((mongoose) => {
				return mongoose;
			})
			.catch((error) => {
				console.error("Failed to connect to MongoDB:", error);
				throw new Error("Failed to connect to MongoDB");
			});
	}
	try {
		cached.conn = await cached.promise;
	} catch (error) {
		cached.promise = null;
		throw error;
	}

	return cached.conn;
};

export default dbConnect;
