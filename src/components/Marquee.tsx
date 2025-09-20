import { Link } from "react-router-dom";

type Item = { text: string; to: string };

export function Marquee({ items }: { items: Item[] }) {
  const content = [...items, ...items]; // дублируем для бесшовного цикла
  return (
    <div className="w-full overflow-hidden bg-[#819570] text-white">
      <div className="flex whitespace-nowrap animate-marquee motion-reduce:animate-none hover:[animation-play-state:paused]">
        {content.map((it, i) => (
          <Link
            key={i}
            to={it.to}
            className="py-2 px-6 uppercase tracking-wide text-sm"
          >
            {it.text}
            <span aria-hidden className="mx-6">•</span>
          </Link>
        ))}
      </div>
    </div>
  );
}