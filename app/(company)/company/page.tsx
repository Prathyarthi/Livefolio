import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { CompanyIndexPage } from "./company-index-page";

export default async function CompanyIndexRoute() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/company");
  }

  return <CompanyIndexPage />;
}