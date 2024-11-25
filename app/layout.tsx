import { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import Analytics from "@/components/Analytics";
import { getMetadata } from "@/src/utils/getMetadata";

const poppins = Poppins({ weight: "400", subsets: ["latin"] });

export const metadata = getMetadata({
  title: "Solana - Impersonator",
  description: "Connect to Solana dapps as any Address!",
  images: "https://solana.impersonator.xyz/metaIMG.png",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
