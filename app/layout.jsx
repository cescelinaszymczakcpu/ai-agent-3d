import './globals.css';

export const metadata = {
  title: 'ALTER — Second Life',
  description: 'Interactive ALTER prototype',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
