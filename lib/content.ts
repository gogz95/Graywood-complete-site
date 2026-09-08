import { prisma } from "@/lib/prisma";

export async function getSiteContent(scope: string): Promise<Record<string, string>> {
  try {
    const entries = await prisma.siteContent.findMany({ where: { scope } });
    return entries.reduce((acc, item) => {
      acc[`${item.section}.${item.key}`] = item.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error(`Error retrieving copy for scope ${scope}:`, error);
    return {};
  }
}

export async function getStudioFeatures(scope: string) {
  try {
    return await prisma.studioFeature.findMany({
      where: { scope },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error(`Error retrieving studio features for scope ${scope}:`, error);
    return [];
  }
}
