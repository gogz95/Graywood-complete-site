import { redirect } from "next/navigation";
import { checkSetupStatus } from "@/lib/setup";
import { SetupWizard } from "@/components/setup/SetupWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "First-Time Setup Wizard | Graywood",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * First-Time Onboarding Wizard Page (/setup)
 *
 * If setup is already complete, immediately redirects operators away to prevent
 * unauthorized reconfiguration.
 */
export default async function SetupPage() {
  const isComplete = await checkSetupStatus();

  if (isComplete) {
    redirect("/admin/login");
  }

  return <SetupWizard />;
}
