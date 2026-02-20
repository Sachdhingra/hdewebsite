import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import ShowroomsPage from "@/pages/ShowroomsPage";
import ContactPage from "@/pages/ContactPage";
import AdminDashboard from "@/pages/AdminDashboard";
import CSVUploadPage from "@/pages/CSVUploadPage";
import CartPage from "@/pages/CartPage";
import CartInquiriesPage from "@/pages/CartInquiriesPage";
import ProductEditPage from "@/pages/ProductEditPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Header />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/showrooms" element={<ShowroomsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/products" element={<CategoryPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/csv-upload" element={<CSVUploadPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
