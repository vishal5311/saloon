import Sidebar from "@/components/Dashboard/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-white min-h-screen selection:bg-blue-500/30 selection:text-blue-100">
        <Sidebar />
        <main className="pl-72 min-h-screen relative">
          <div className="p-12 relative z-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
