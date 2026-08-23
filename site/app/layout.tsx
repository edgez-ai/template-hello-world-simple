import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Hello World",
  description: "A simple Hello World web app",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
