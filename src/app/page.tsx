import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
	const { isLoaded, userId } = useAuth();
	const [files, setFiles] = useState([]);

	useEffect(() => {
		if (userId) {
			fetchFiles();
		}
	}, [userId]);

	const fetchFiles = async () => {
		const response = await axios.get("/api/files");
		setFiles(response.data);
	};

	const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const formData = new FormData();
		formData.append("file", e.target.files[0]);
		formData.append("userId", userId);

		await axios.post("/api/files/upload", formData);
		fetchFiles();
	};

	const deleteFile = async (id: string) => {
		await axios.delete(`/api/files/${id}`);
		fetchFiles();
	};

	if (!isLoaded) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<h1>Welcome, {userId}</h1>
			<input type="file" onChange={uploadFile} />
			<ul>
				{files.map((file) => (
					<li key={file._id}>
						<a href={file.url}>{file.filename}</a>
						<button onClick={() => deleteFile(file._id)}>Delete</button>
					</li>
				))}
			</ul>
		</div>
	);
}
