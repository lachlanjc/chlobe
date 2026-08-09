import type { Metadata } from 'next';
import localFont from 'next/font/local';
import React from 'react';
import type { ReactNode } from 'react';

import '@stylexswc/webpack-plugin/stylex.css';
import './globals.css';

const booton = localFont({
  display: 'swap',
  src: [
    {
      path: './fonts/Booton-Regular.woff2',
      style: 'normal',
      weight: '400',
    },
    {
      path: './fonts/Booton-Medium.woff2',
      style: 'normal',
      weight: '500',
    },
    {
      path: './fonts/Booton-SemiBold.woff2',
      style: 'normal',
      weight: '600',
    },
  ],
  variable: '--font-booton',
});

export const metadata: Metadata = {
  description:
    'Lightweight WebGL globe for rendering values of countries as shaded regions.',
  title: 'Cobe Countries',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={booton.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
