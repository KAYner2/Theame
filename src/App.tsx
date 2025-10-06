import YandexMetrikaListener from "./components/YandexMetrikaListener";
import SortableTest from "./components/SortableTest";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DevErrorBoundary } from "@/components/DevErrorBoundary";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import PublicOffer from "./pages/PublicOffer";
import AnyProductPage from "./pages/AnyProductPage";
import CartPage from "./pages/CartPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentError from "./pages/PaymentError";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import Delivery from "./pages/Delivery"; // 👈 добавлен импорт
import VariantProductPage from "./pages/VariantProductPage";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WhatsAppFloat } from "./components/WhatsAppFloat";

import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <FavoritesProvider>
          <Sonner position="bottom-right" richColors closeButton />

          <BrowserRouter>
            {/* Оборачиваем ВСЁ приложение в ErrorBoundary */}
            <DevErrorBoundary>
              <YandexMetrikaListener />
              <Header />

              <main className="min-h-screen">
                <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/catalog" element={<Catalog />} />
  <Route path="/favorites" element={<Favorites />} />

  {/* ЕДИНАЯ страница для ЛЮБОГО товара */}
  <Route path="/catalog/:productSlug" element={<AnyProductPage />} />
  <Route path="/catalog/:categorySlug/:productSlug" element={<AnyProductPage />} />

  {/* legacy по id — если используешь */}
  <Route path="/product/:id" element={<ProductPage />} />

  {/* опционально: прямые ссылки на вариантные товары */}
  <Route path="/v/:slug" element={<VariantProductPage />} />
  {/* /vp/:slug был тестовый — лучше удалить, чтобы не путать */}

  <Route path="/cart" element={<CartPage />} />
  <Route path="/admin" element={<Admin />} />
  <Route path="/about" element={<About />} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/delivery" element={<Delivery />} />
  <Route path="/privacy" element={<Privacy />} />
  <Route path="/public-offer" element={<PublicOffer />} />
  <Route path="/success" element={<PaymentSuccess />} />
  <Route path="/payment-error" element={<PaymentError />} />
  <Route path="/success" element={<Navigate to="/payment-success" replace />} />
  <Route path="/fail" element={<Navigate to="/payment-error" replace />} />
  <Route path="/test-sort" element={<SortableTest />} />
  <Route path="*" element={<NotFound />} />
</Routes>

              </main>

              <Footer />
              <WhatsAppFloat />
            </DevErrorBoundary>
          </BrowserRouter>
        </FavoritesProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
