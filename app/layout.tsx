import Script from 'next/script'
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <Script
          src="https://umami-analytics-seven-zeta.vercel.app/script.js"
          data-website-id="9961c0d7-6fed-4dae-b977-730ba59bece8"
          strategy="afterInteractive"
        />
      </head>
      <body className={plusJakartaSans.className}><SessionProviderWrapper>{children}</SessionProviderWrapper></body>
    </html>
  );
}
