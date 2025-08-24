import YandexMetrikaListener from "./components/YandexMetrikaListener";
import SortableTest from "./components/SortableTest";
// import { Toaster } from "@/components/ui/toaster"; // ⛔ убрали shadcn-тостер
import { Toaster as Sonner } from "@/components/ui/sonner"; // ✅ оставляем только Sonner
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
          {/* ✅ используем только Sonner */}
          <Sonner position="bottom-right" richColors closeButton />

          <BrowserRouter>
            <YandexMetrikaListener />
            <Header />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/favorites" element={<Favorites />} />
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
                <Route path="*" element={<NotFound />} />
                <Route path="/success" element={<Navigate to="/payment-success" replace />} />
                <Route path="/fail" element={<Navigate to="/payment-error" replace />} />
                <Route path="/test-sort" element={<SortableTest />} />
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