import { Link } from "react-router-dom";

export function BrandingStrip() {
  return (
    <section className="relative bg-[#fee9c3]/0">
      {/* ПРАВЫЙ ИНФО-БЛОК (часть этой секции, не шапки) */}
      <div className="hidden md:block absolute top-4 right-4 text-[#819570] text-xs leading-snug tracking-wide text-right">
        <div>Режим работы: с 09:00 до 21:00</div>
        <div>Доставка букетов ~45 минут</div>

        <div className="mt-2 flex items-center justify-end gap-3">
          <a
            href="https://www.instagram.com/theame.flowers"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5Z" stroke="#819570" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3.5" stroke="#819570" strokeWidth="1.5" />
              <circle cx="17.5" cy="6.5" r="1" fill="#819570" />
            </svg>
          </a>

          <a
            href="https://t.me/the_ame_flowers"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="inline-flex"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M21.7 3.3L2.8 10.6c-.9.35-.88 1.66.04 1.97l4.73 1.62 1.83 4.87c.34.9 1.59.97 2 .11l2.52-5.01 4.8-7.68c.53-.85-.3-1.88-1.52-1.58Z" stroke="#819570" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </a>

          <Link to="/favorites" aria-label="Избранное" className="inline-flex">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.35-9.5-8.21C.83 10.03 2.2 6.5 5.6 6.5c2.05 0 3.4 1.22 4 2.22.6-1 1.95-2.22 4-2.22 3.4 0 4.77 3.53 3.1 6.29C19 16.65 12 21 12 21Z" stroke="#819570" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ТВОЙ существующий контент: центрированный логотип + чипсы */}
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl" style={{ fontFamily: "Forum, serif", color: "#819570" }}>
            The Áme
          </h1>

          {/* тут твои «чипсы» категорий */}
          {/* ... */}
        </div>

        {/* мобильная версия инфо-блока — под логотипом */}
        <div className="md:hidden mt-6 text-[#819570] text-xs leading-snug tracking-wide text-center">
          <div>Режим работы: с 09:00 до 21:00</div>
          <div>Доставка букетов ~45 минут</div>
          <div className="mt-2 flex items-center justify-center gap-4">
            <a href="https://www.instagram.com/theame.flowers" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex">
              {/* можно тот же SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5Z" stroke="#819570" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3.5" stroke="#819570" strokeWidth="1.5" />
                <circle cx="17.5" cy="6.5" r="1" fill="#819570" />
              </svg>
            </a>
            <a href="https://t.me/the_ame_flowers" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="inline-flex">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M21.7 3.3L2.8 10.6c-.9.35-.88 1.66.04 1.97l4.73 1.62 1.83 4.87c.34.9 1.59.97 2 .11l2.52-5.01 4.8-7.68c.53-.85-.3-1.88-1.52-1.58Z" stroke="#819570" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </a>
            <Link to="/favorites" aria-label="Избранное" className="inline-flex">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s-7-4.35-9.5-8.21C.83 10.03 2.2 6.5 5.6 6.5c2.05 0 3.4 1.22 4 2.22.6-1 1.95-2.22 4-2.22 3.4 0 4.77 3.53 3.1 6.29C19 16.65 12 21 12 21Z" stroke="#819570" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
