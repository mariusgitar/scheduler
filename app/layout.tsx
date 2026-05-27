import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import './home.css'
import SessionProviderWrapper from '../components/SessionProviderWrapper'

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
      <body className={plusJakartaSans.className}><SessionProviderWrapper>{children}</SessionProviderWrapper></body>
    </html>
  );
}
