import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import ShowroomsPage from "@/pages/ShowroomsPage";
import ContactPage from "@/pages/ContactPage";
import AdminDashboard from "@/pages/AdminDashboard";
import CSVUploadPage from "@/pages/CSVUploadPage";
import CartPage from "@/pages/CartPage";
import CartInquiriesPage from "@/pages/CartInquiriesPage";
import ProductEditPage from "@/pages/ProductEditPage";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <CartProvider>
        <BrowserRouter>
          <Header />
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/product/:productId" element={<ProductDetailPage />} />
              <Route path="/showrooms" element={<ShowroomsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/products" element={<CategoryPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/csv-upload" element={<CSVUploadPage />} />
              <Route path="/admin/cart-inquiries" element={<CartInquiriesPage />} />
              <Route path="/admin/products" element={<ProductEditPage />} />
            </Routes>
          </main>
          <Footer />
          <LeadCapturePopup />
          <Toaster />
        </BrowserRouter>
      </CartProvider>
    </div>
  );
}

export default App;
