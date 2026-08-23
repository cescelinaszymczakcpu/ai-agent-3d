import './globals.css';
import './limbs.css';
import LimbInjector from './LimbInjector';

export const metadata = {
  title: 'ALTER — Second Life',
  description: 'Interactive ALTER prototype',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        {children}
        <LimbInjector />
      </body>
    </html>
  );
}
