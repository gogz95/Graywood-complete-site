import { headers } from "next/headers";
import { type DomainKey, DOMAIN_HEADER } from "@/lib/domain";
import PhotographyPage from "./(photography)/PhotographyPage";
import MediaPage from "./(media)/MediaPage";
import MainPage from "./(main)/MainPage";

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
      return <MainPage />;
    case "PHOTOGRAPHY":
    default:
      return <PhotographyPage />;
  }
}
