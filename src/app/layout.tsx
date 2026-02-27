import type { Metadata } from 'next';
import { Caveat, Cormorant_Garamond, Dancing_Script, DM_Sans, Inter, Playfair_Display } from 'next/font/google';
import { Providers } from '@/app/providers';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair'
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700']
});

const dancing = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700']
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://livecardstudio.com'),
  title: {
    default: 'LiveCardStudio.com',
    template: '%s | LiveCardStudio.com'
  },
  description: 'Living cards for the moments that matter. Handcrafted, animated, interactive digital greeting cards.',
  openGraph: {
    title: 'LiveCardStudio.com',
    description: 'Living cards for the moments that matter.',
    siteName: 'LiveCardStudio.com',
    type: 'website',
    url: 'https://livecardstudio.com'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LiveCardStudio.com',
    description: 'Living cards for the moments that matter.'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${dancing.variable} ${inter.variable} ${dmSans.variable} ${caveat.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <div className="relative z-10">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
