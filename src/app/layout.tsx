import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://openmate-zq7d.onrender.com'),
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
    url: 'https://openmate-zq7d.onrender.com',
    siteName: 'OpenMate',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
