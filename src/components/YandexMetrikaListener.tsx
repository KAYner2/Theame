import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    ym?: (...args: any[]) => void;
  }
}

export default function YandexMetrikaListener() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && window.ym) {
      const url = location.pathname + location.search + location.hash;
      window.ym(103806735, "hit", url, {
        referer: document.referrer,
      });
    }
  }, [location]);

  return null;
}
