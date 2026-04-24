import Sidebar from "@/components/Dashboard/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F6F6F6] text-[#0C0B07] min-h-screen selection:bg-blue-100 selection:text-blue-900">
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
