import { useState, useEffect } from "react";

const FolderManager = () => {
	const [folders, setFolders] = useState([]);
	const [newFolderName, setNewFolderName] = useState("");

	const fetchFolders = async () => {
		const response = await fetch("/api/folders");
		const data = await response.json();
		setFolders(data);
	};

	const createFolder = async () => {
		if (!newFolderName) return;

		const response = await fetch("/api/folders", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: newFolderName })
		});

		if (response.ok) {
			fetchFolders();
			setNewFolderName("");
		}
	};

	useEffect(() => {
		fetchFolders();
	}, []);

	return (
		<div>
			<h1>Your Folders</h1>
			<input
				type="text"
				value={newFolderName}
				onChange={(e) => setNewFolderName(e.target.value)}
				placeholder="New folder name"
			/>
			<button onClick={createFolder}>Create Folder</button>
			<ul>
				{folders.map((folder) => (
					<li key={folder._id}>{folder.name}</li>
				))}
			</ul>
		</div>
	);
};

export default FolderManager;
