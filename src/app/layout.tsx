import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | OpenMate',
    default: 'OpenMate — Find Your First Open-Source Contribution',
  },
  description:
    'OpenMate helps developers understand unfamiliar open-source repositories and find an actionable, personalized path toward their first contribution.',
  applicationName: 'OpenMate',
  authors: [{ name: 'OpenMate Team' }],
  keywords: [
    'open-source',
    'contributions',
    'first pull request',
    'developer tools',
    'repository analysis',
    'hacktoberfest',
  ],
  openGraph: {
    title: 'OpenMate — Find Your First Open-Source Contribution',
    description:
      'Personalized repository onboarding for developers making their first open-source contribution.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
