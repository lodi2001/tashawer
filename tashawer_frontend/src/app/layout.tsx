import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Tashawer - Engineering Consultation Platform',
  description: 'Connect with engineering consultants in Saudi Arabia',
  icons: {
    icon: '/favicon.ico',
  },
};

// Root layout - required html/body tags for Next.js
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
