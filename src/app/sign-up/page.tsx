import { permanentRedirect } from "next/navigation";

type SignUpCompatibilityPageProps = {
  searchParams: Promise<{
    email?: string | string[];
    token?: string | string[];
  }>;
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpCompatibilityPage({
  searchParams,
}: SignUpCompatibilityPageProps) {
  const params = await searchParams;
  const token = firstValue(params.token)?.trim();
  const email = firstValue(params.email)?.trim();

  if (token) {
    const emailQuery = email ? `?email=${encodeURIComponent(email)}` : '';
    permanentRedirect(`/invite/${encodeURIComponent(token)}${emailQuery}`);
  }

  permanentRedirect("/register");
}
