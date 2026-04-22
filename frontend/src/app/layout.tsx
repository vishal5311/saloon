import Sidebar from "@/components/Dashboard/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">
        <Sidebar />
        <main className="pl-64 min-h-screen">
          <div className="p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
