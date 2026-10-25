import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aether Love — Happy Birthday Rainy',
  description: 'A deeply personal romantic universe crafted with infinite love for Rainy on her birthday.',
  openGraph: {
    title: 'Aether Love — For My Starlight Rainy',
    description: 'A bespoke universe of our cherished memories, quiet laughs, and lifelong promises.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#090a14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
