import { Link } from "react-router-dom";

type BrandProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Brand({ size = "md", className = "" }: BrandProps) {
  return (
    <Link
      to="/"
      className={`flex flex-col items-center justify-center select-none ${className}`}
    >
      <span className="font-medium text-base md:text-lg text-green-400">
        The Âme
      </span>
      <span className="text-green-400 tracking-wide">
        ЦВЕТЫ X ЧУВСТВА
      </span>
    </Link>
  );
}
