import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dialog Kinerja",
    template: "%s · Dialog Kinerja",
  },
  description: "Aplikasi Dialog Kinerja terintegrasi IDP",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={cn("font-mono", jetbrainsMono.variable)}>
      <body className="min-h-full flex flex-col bg-background font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
