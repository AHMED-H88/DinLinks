import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// The ACCOUNT group has no index page — send /dashboard/account to General.
export default function DashboardAccountIndexPage() {
  redirect("/dashboard/account/general");
}
