import { permanentRedirect } from "next/navigation";

type InvitationTokenPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    email?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InvitationTokenPage({
  params,
  searchParams,
}: InvitationTokenPageProps) {
  const { token } = await params;
  const email = firstValue((await searchParams).email)?.trim();
  const emailQuery = email ? `?email=${encodeURIComponent(email)}` : '';

  permanentRedirect(`/invite/${encodeURIComponent(token)}${emailQuery}`);
}
