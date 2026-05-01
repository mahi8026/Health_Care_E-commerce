import { Plus_Jakarta_Sans, Lora } from "next/font/google";
import "./globals.css";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import Footer from "@/components/layout/Footer";
import TopBar from "@/components/layout/TopBar";
import HeaderWrapper from "@/components/layout/HeaderWrapper";
import BottomNav from "@/components/layout/BottomNav";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export const dynamic = 'force-dynamic';

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600'],
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: 'swap',
});

const lora = Lora({
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  subsets: ["latin"],
  variable: "--font-lora",
  display: 'swap',
});

export const metadata = {
  title: "MedCore BD - Medical Equipment & Supplies",
  description: "Your complete source for medical excellence. Surgical instruments, diagnostic machines, reagents, and lab equipment.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://health-care-e-commerce.vercel.app'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${lora.variable}`}>
      <body className="min-h-screen">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {/* <WebVitalsReporter /> */}
              <TopBar />
              <HeaderWrapper />
              <main>{children}</main>
              <Footer />
              <BottomNav />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
