import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Sophra Data Layer',
  description: 'Data synchronization and management layer for Sophra',
};

export default function RootLayout({
  children,
}: PropsWithChildren): JSX.Element {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
