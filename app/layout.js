import { Toaster } from "@/components/ui/sonner";
import "./globals.css";


export const metadata = {
  title: "PriceSnap",
  description: "Web app to track your favourite products and get notified when they drop in price.",
  icons: {
    icon: "/Logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}
        <Toaster richColors/>
      </body>
    </html>
  );
}
