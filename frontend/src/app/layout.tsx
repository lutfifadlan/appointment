import "./globals.css";
import type { Metadata } from "next";
import { Common, Document } from "@/constants";
import Providers from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: Common.title,
  description: Common.description,
  keywords: Document.meta.keywordsContent,
  openGraph: {
    title: Common.title,
    description: Common.description,
    url: Document.ogUrl,
    type: Document.ogType as "website",
    images: [
      {
        url: Document.ogImage,
        width: 1200,
        height: 630,
      },
    ],
  },
  icons: {
    icon: Document.icon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={Document.fontUrl} rel="stylesheet" />
      </head>
      <body className="font-display">
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
