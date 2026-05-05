"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { AuthProvider } from '../components/contexts/AuthContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              toast: "font-sans text-sm",
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}