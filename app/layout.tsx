import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

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
    <html lang="id" className={poppins.variable}>
      <body className="min-h-full flex flex-col bg-background font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
