// ОДНА фраза, крутится по кругу и вся кликабельна
export function Marquee({
  text = "осень за окном",
  href,
  duplicates = 10, // сколько раз повторить фразу в одной дорожке
}: {
  text?: string;
  href: string;
  duplicates?: number;
}) {
  // повторяем фразу много раз и дублируем дорожку второй раз для бесшовного цикла
  const row = Array.from({ length: duplicates }, () => text);
  const content = [...row, ...row];

  return (
    <div className="w-full overflow-hidden bg-[#819570] text-white">
      <div className="flex whitespace-nowrap animate-marquee motion-reduce:animate-none hover:[animation-play-state:paused]">
        {content.map((t, i) => (
          <a
            key={i}
            href={href}
            className="py-2 px-8 text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
          >
            {t}
            <span aria-hidden className="mx-6">•</span>
          </a>
        ))}
      </div>
    </div>
  );
}