import { HubPillars } from "@/components/hub/HubPillars";

export const dynamic = "force-dynamic";

export default function HubPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HubPillars />
    </div>
  );
}
