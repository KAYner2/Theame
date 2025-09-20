import YandexMetrikaListener from "./components/YandexMetrikaListener";
import SortableTest from "./components/SortableTest";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import PublicOffer from "./pages/PublicOffer";
import CartPage from "./pages/CartPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentError from "./pages/PaymentError";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";

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
            <YandexMetrikaListener />
            <Header />

            {/* === Боковые декоративные «хвостики» === */}
            <div
              aria-hidden
              className="
                pointer-events-none fixed top-0 left-0
                w-4 h-10 bg-[#ffe9c3]
                rounded-br-full
                z-40
              "
            />
            <div
              aria-hidden
              className="
                pointer-events-none fixed bottom-0 left-0
                w-4 h-10 bg-[#ffe9c3]
                rounded-tr-full
                z-40
              "
            />
            <div
              aria-hidden
              className="
                pointer-events-none fixed top-0 right-0
                w-4 h-10 bg-[#ffe9c3]
                rounded-bl-full
                z-40
              "
            />
            <div
              aria-hidden
              className="
                pointer-events-none fixed bottom-0 right-0
                w-4 h-10 bg-[#ffe9c3]
                rounded-tl-full
                z-40
              "
            />
            {/* === /хвостики === */}

            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/catalog/:productSlug" element={<ProductPage />} />
                <Route path="/catalog/:categorySlug/:productSlug" element={<ProductPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
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
          </BrowserRouter>
        </FavoritesProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
