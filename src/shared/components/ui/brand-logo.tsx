import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 36, className = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/lexchain/logo-lexchain.svg"
        alt="LexChain"
        width={size}
        height={size}
        className="rounded-[10px]"
      />
      <span className="text-lg font-black text-[var(--brand-navy)]">
        Lex<span className="text-[var(--brand-blue)]">Chain</span>
      </span>
    </div>
  );
}
