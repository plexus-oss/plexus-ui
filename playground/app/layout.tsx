import type { Metadata } from "next";
import "./globals.css";
import { Open_Sans, Space_Grotesk } from "next/font/google";
import { Providers } from "@/app/providers";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Plexus UI - Playground",
  description:
    "Primitive-based aerospace & physics component library for React Three Fiber. Build stunning 3D planetary visualizations and aerospace UI with composable primitives.",
  keywords: [
    "aerospace",
    "react-three-fiber",
    "3d",
    "visualization",
    "physics",
    "orbital-mechanics",
    "planets",
    "ui-components",
    "primitives",
  ],
  authors: [{ name: "Plexus UI" }],
  openGraph: {
    title: "Plexus UI - Playground",
    description:
      "Primitive-based deep tech & physics component library. Build stunning 3D planetary visualizations and aerospace UI with composable primitives.",
    type: "website",
    images: [
      {
        url: "/main.png",
        width: 1200,
        height: 630,
        alt: "Plexus UI - Deep Tech Components",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plexus UI - Playground",
    description:
      "Primitive-based deep tech & physics component library. Build stunning 3D planetary visualizations.",
    images: ["/main.png"],
  },
};

const geist = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="flex flex-col h-screen w-screen overflow-hidden">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
              <LayoutWrapper>{children}</LayoutWrapper>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
