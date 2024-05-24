import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
// import FolderManager from "../components/FolderManager";

const HomePage = () => {
	// const { user } = useUser();

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				height: "100vh",
				justifyContent: "center"
			}}
		>
			<SignedIn>
				<div>
					{/* <p>Welcome, {user?.firstName}!</p> */}
					<UserButton />
					{/* <FolderManager /> */}
				</div>
			</SignedIn>
			<SignedOut>
				<div>
					<Link href="/sign-in">
						<a>Sign In</a>
					</Link>
					<Link href="/sign-up">
						<a>Sign Up</a>
					</Link>
				</div>
			</SignedOut>
		</div>
	);
};

export default HomePage;
