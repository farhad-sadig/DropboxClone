import AWS from "aws-sdk";

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION
});

export const uploadFile = async (
	file: Buffer,
	bucketName: string,
	key: string
) => {
	const params = {
		Bucket: bucketName,
		Key: key,
		Body: file,
		ACL: "public-read"
	};

	return s3.upload(params).promise();
};

export const deleteFile = async (bucketName: string, key: string) => {
	const params = {
		Bucket: bucketName,
		Key: key
	};

	return s3.deleteObject(params).promise();
};
