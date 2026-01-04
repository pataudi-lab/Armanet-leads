import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navigation } from "@/components/navigation";
import { auth } from "@/auth";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Armanet Ad Poacher",
  description: "Admin UI for ad detection and lead scoring",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers session={session}>
          <div className="flex min-h-screen">
            {session ? <Navigation /> : null}
            <main className="flex-1 px-6 py-6">
              {!session ? (
                <div className="flex h-screen items-center justify-center">
                  <Link
                    href="/login"
                    className="rounded bg-indigo-500 px-4 py-2 font-semibold text-white shadow"
                  >
                    Login to continue
                  </Link>
                </div>
              ) : (
                children
              )}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
