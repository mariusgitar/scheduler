import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import './home.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin']
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
