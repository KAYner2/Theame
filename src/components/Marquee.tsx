// ОДНА фраза, крутится по кругу и вся кликабельна
export function Marquee({
  text = "осенняя коллекция",
  href,
  duplicates = 10,
  speed = 28,           // секунды на цикл (быстрее чем 28)
}: {
  text?: string;
  href: string;
  duplicates?: number;
  speed?: number;
}) {
  // формируем дорожку и дублируем для бесшовности
  const row = Array.from({ length: duplicates }, () => text);
  const content = [...row, ...row];

return (
  <div className="w-full overflow-hidden bg-[#819570] text-white h-9 flex items-center">
    <div
      className="flex items-center whitespace-nowrap animate-marquee"
      style={{ ["--marquee-duration" as any]: `${speed}s` }} // если используешь var
    >
        {content.map((t, i) => (
          <div key={i} className="flex items-center">
            {/* кликабельна вся фраза */}
            <a
              href={href}
              className="py-2 px-8 text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
            >
              {t}
            </a>

            {/* КРУЖОК-РАЗДЕЛИТЕЛЬ строго между фразами */}
            <span className="mx-6 inline-flex items-center justify-center" aria-hidden>
              <span className="block w-2 h-2 rounded-full bg-current" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}