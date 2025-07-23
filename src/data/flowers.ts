import { Flower } from '../types/flower';
import redRoses from '../assets/red-roses.jpg';
import whiteTulips from '../assets/white-tulips.jpg';
import pinkPeonies from '../assets/pink-peonies.jpg';
import lavender from '../assets/lavender.jpg';
import sunflowers from '../assets/sunflowers.jpg';

export const mockFlowers: Flower[] = [
  {
    id: '1',
    name: 'Красные розы',
    price: 2500,
    image: redRoses,
    description: 'Элегантные красные розы высшего качества. Символ любви и страсти.',
    category: 'roses',
    inStock: true,
    quantity: 15,
    colors: ['красный'],
    size: 'medium',
    occasion: ['романтика', 'свидание', 'день рождения']
  },
  {
    id: '2',
    name: 'Белые тюльпаны',
    price: 1800,
    image: whiteTulips,
    description: 'Нежные белые тюльпаны - символ чистоты и невинности.',
    category: 'tulips',
    inStock: true,
    quantity: 22,
    colors: ['белый'],
    size: 'medium',
    occasion: ['свадьба', 'подарок', 'день рождения']
  },
  {
    id: '3',
    name: 'Розовые пионы',
    price: 3200,
    image: pinkPeonies,
    description: 'Пышные розовые пионы с нежным ароматом. Идеальны для особых случаев.',
    category: 'peonies',
    inStock: true,
    quantity: 8,
    colors: ['розовый'],
    size: 'large',
    occasion: ['свадьба', 'юбилей', 'праздник']
  },
  {
    id: '4',
    name: 'Лаванда',
    price: 1500,
    image: lavender,
    description: 'Ароматная лаванда с успокаивающими свойствами.',
    category: 'lavender',
    inStock: true,
    quantity: 12,
    colors: ['фиолетовый'],
    size: 'small',
    occasion: ['декор', 'ароматерапия', 'подарок']
  },
  {
    id: '5',
    name: 'Подсолнухи',
    price: 2000,
    image: sunflowers,
    description: 'Яркие подсолнухи, которые дарят радость и позитив.',
    category: 'sunflowers',
    inStock: false,
    quantity: 0,
    colors: ['желтый'],
    size: 'large',
    occasion: ['день рождения', 'благодарность', 'поздравление']
  },
  {
    id: '6',
    name: 'Микс роз',
    price: 2800,
    image: redRoses,
    description: 'Букет из разноцветных роз - отличный выбор для любого случая.',
    category: 'roses',
    inStock: true,
    quantity: 10,
    colors: ['красный', 'белый', 'розовый'],
    size: 'large',
    occasion: ['универсальный', 'день рождения', 'поздравление']
  }
];

export const categories = [
  { id: 'all', name: 'Все цветы' },
  { id: 'roses', name: 'Розы' },
  { id: 'tulips', name: 'Тюльпаны' },
  { id: 'peonies', name: 'Пионы' },
  { id: 'sunflowers', name: 'Подсолнухи' },
  { id: 'lavender', name: 'Лаванда' }
];