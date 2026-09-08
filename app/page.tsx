import { headers } from "next/headers";
import { type DomainKey, DOMAIN_HEADER } from "@/lib/domain";
import PhotographyPage from "@/app/photography/page";
import MediaPage from "@/app/media/page";
import HubPage from "@/app/hub/page";

/**
 * Root page — dispatches to the correct domain landing page.
 * The domain is resolved by proxy.ts and injected as x-gw-domain.
 */
export default async function RootPage() {
  const headersList = await headers();
  const domain = (headersList.get(DOMAIN_HEADER) ?? "PHOTOGRAPHY") as DomainKey;

  switch (domain) {
    case "MEDIA":
      return <MediaPage />;
    case "MAIN":
      return <HubPage />;
    case "PHOTOGRAPHY":
    default:
      return <PhotographyPage />;
  }
}
