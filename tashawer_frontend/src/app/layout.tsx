import { ReactNode } from 'react';

// Root layout - minimal, just passes through to locale layout
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
