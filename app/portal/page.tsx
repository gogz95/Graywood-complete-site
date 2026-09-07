import { notFound } from "next/navigation";

/**
 * app/portal/page.tsx
 *
 * Zero-Discovery Lockout: Direct root access to /portal is strictly forbidden.
 * Unlisted client proofing portals require the exact private album slug.
 */
export default function PortalIndexPage() {
  notFound();
}
