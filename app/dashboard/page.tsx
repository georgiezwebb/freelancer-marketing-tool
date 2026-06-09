import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getOrCreateAppUser } from "@/lib/app-user";
import { getCopyTypesWithVersions } from "@/lib/copy-types";
import { serializeType } from "@/lib/dashboard-types";

export default async function DashboardPage() {
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/");
  }

  const rows = await getCopyTypesWithVersions(user.id);
  const initialTypes = rows.map(serializeType);

  return <DashboardClient initialTypes={initialTypes} />;
}
