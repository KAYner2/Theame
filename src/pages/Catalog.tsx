import { useEffect } from 'react';
import { FlowerCatalog } from '../components/FlowerCatalog';

export default function Catalog() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return <FlowerCatalog />;
}