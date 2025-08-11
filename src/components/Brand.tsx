import { Link } from "react-router-dom";
import logoUrl from "@/assets/logo.png";

type BrandProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Brand({ size = "md", className = "" }: BrandProps) {
  const px = { sm: 18, md: 24, lg: 32 }[size];

  return (
    <Link to="/" className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Название магазина */}
      <span className="leading-none tracking-wide">
        <span className="font-medium text-base md:text-lg">The Âme</span>
        <span className="mx-2 opacity-60">—</span>
        <span className="opacity-80">Цветы × чувства</span>
      </span>

      {/* Лого справа от названия */}
      <img
        src={logoUrl}
        alt="Логотип The Âme"
        width={px}
        height={px}
        decoding="async"
        className="
          rounded-full
          bg-foreground  /* чёрный фон логотипа сольётся с кругом */
          ring-1 ring-foreground/10 shadow-[var(--shadow-soft)]
          p-0.5
          transition-transform duration-200 will-change-transform
          hover:scale-105
        "
      />
    </Link>
  );
}
