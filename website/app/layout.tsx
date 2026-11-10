import type { Metadata } from 'next';
import { Fragment_Mono } from 'next/font/google';
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

const fragmentMono = Fragment_Mono({
  subsets: ['latin'],
  variable: '--font-fragment-mono',
  weight: '400',
});

// Next.js requires metadata to be exported from the layout module.
// oxlint-disable-next-line react-doctor/only-export-components
export const metadata: Metadata = {
  description:
    'Lightweight WebGL globe for rendering values of countries as shaded regions.',
  title: 'Chlobe',
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html className={`${booton.variable} ${fragmentMono.variable}`} lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
