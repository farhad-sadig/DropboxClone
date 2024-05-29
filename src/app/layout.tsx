import type { Metadata } from "next";
import { Inter } from "next/font/google";
import {
	ClerkProvider,
	SignInButton,
	SignedIn,
	SignedOut,
	UserButton
} from "@clerk/nextjs";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Dropbox Clone"
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body className={inter.className}>
					<SignedOut>
						<SignInButton />
					</SignedOut>
					<SignedIn>
						<UserButton />
					</SignedIn>
					<Providers>{children}</Providers>
				</body>
			</html>
		</ClerkProvider>
	);
}
