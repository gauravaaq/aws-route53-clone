import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Route 53 - AWS Management Console",
  description: "Functional clone of the AWS Route53 web console with hosted zones and DNS record management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/aws-logo.svg" type="image/svg+xml" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
