// src/pages/Catalog.tsx
import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { FlowerCatalog } from '../components/FlowerCatalog';

export default function Catalog() {
  // скролл наверх при заходе на страницу
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Helmet>
        <title>Купить букет с доставкой по Сочи — свежие цветы и монобукеты | The Ame</title>
        <meta
          name="description"
          content="Каталог The Ame: свежие букеты, монобукеты и композиции в коробках. Розы, гортензии, хризантемы — доставка по Сочи от 45 минут."
        />
        <meta
          name="keywords"
          content="каталог букетов Сочи, купить букет, букеты с доставкой, авторские букеты, монобукеты, композиции из цветов, цветы в коробках, цветы в корзинах, розы, пионовидные розы, гортензии, хризантемы, тюльпаны, ромашки, альстромерии, цветы на день рождения, цветы на 8 марта, цветы для любимой, букет на юбилей, доставка букетов 24/7, свежие цветы Сочи"
        />

        {/* (необязательно, но полезно) базовые OG-теги */}
        <meta property="og:title" content="Купить букеты с доставкой по Сочи – авторские, монобукеты и композиции | The Ame" />
        <meta
          property="og:description"
          content="Каталог The Ame: свежие букеты, монобукеты и композиции в коробках. Розы, гортензии, хризантемы — доставка по Сочи от 45 минут."
        />
        <meta property="og:type" content="website" />
        {/* <meta property="og:url" content="https://theame.ru/catalog" /> */}
        {/* <meta property="og:image" content="https://theame.ru/og/catalog.jpg" /> */}
      </Helmet>

      <FlowerCatalog />
    </>
  );
}
