import './globals.css';
export const metadata = { title: 'ProposalFlow', description: 'Dari Deal ke Duit dalam Satu Alur' };
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans antialiased">{children}</body>
    </html>
  );
}
