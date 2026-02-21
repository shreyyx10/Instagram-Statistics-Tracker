import "./globals.css";

export const metadata = {
  title: "Instagram Unfollower Tracker",
  description: "Privacy-first unfollower tracker (client-side)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
