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
        <title>Купить букеты с доставкой по Сочи – авторские, монобукеты и композиции | The Ame</title>
        <meta
          name="description"
          content="Каталог букетов с доставкой по Сочи от The Ame: авторские и монобукеты, композиции в коробках и корзинах. Розы, пионовидные розы, гортензии, хризантемы и другие свежие цветы. Быстрая доставка по Сочи."
        />
        <meta
          name="keywords"
          content="букеты с доставкой по Сочи, купить букет Сочи, авторские букеты, монобукеты, цветы в коробках, цветы в корзинах, розы, пионовидные розы, кустовые розы, французские розы, гортензии, хризантемы, диантусы, альстромерии, герберы, ромашки, подсолнухи"
        />

        {/* (необязательно, но полезно) базовые OG-теги */}
        <meta property="og:title" content="Купить букеты с доставкой по Сочи – авторские, монобукеты и композиции | The Ame" />
        <meta
          property="og:description"
          content="Каталог букетов с доставкой по Сочи от The Ame: авторские и монобукеты, композиции в коробках и корзинах. Розы, пионовидные розы, гортензии, хризантемы и другие свежие цветы. Быстрая доставка по Сочи."
        />
        <meta property="og:type" content="website" />
        {/* <meta property="og:url" content="https://theame.ru/catalog" /> */}
        {/* <meta property="og:image" content="https://theame.ru/og/catalog.jpg" /> */}
      </Helmet>

      <FlowerCatalog />
    </>
  );
}
