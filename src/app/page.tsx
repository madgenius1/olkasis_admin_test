import { redirect } from "next/navigation";

/*
 * Root route: / → /dashboard
 * The middleware.ts will redirect unauthenticated users to /login.
 * Authenticated users will land on /dashboard.
 */
export default function RootPage() {
  redirect("/dashboard");
}