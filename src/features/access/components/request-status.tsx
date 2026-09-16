import { getRequestStatusClassName, getRequestStatusLabel } from "@/features/access/request-ui";

export function RequestStatus({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${getRequestStatusClassName(status)}`}>
      {getRequestStatusLabel(status)}
    </span>
  );
}
