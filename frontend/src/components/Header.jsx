import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingCart, MapPin, Phone, Menu, X } from 'lucide-react';
import { Button } from './ui/button';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('homes');

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-800 text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/become-dealer" className="hover:text-gray-300 transition-colors flex items-center gap-1">
              Become a dealer
            </Link>
            <Link to="/showrooms" className="hover:text-gray-300 transition-colors flex items-center gap-1">
              <MapPin size={16} />
              Store locator
            </Link>
            <Link to="/contact" className="hover:text-gray-300 transition-colors flex items-center gap-1">
              <Phone size={16} />
              Contact us
            </Link>
          </div>
          <div className="hidden md:block">
            <span className="text-gray-300">Services</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded font-bold text-xl">
                  HDE
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Home Decor</h1>
                  <p className="text-xs text-gray-500">Enterprises</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-1">by Godrej Interio • Since 2006</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <button className="text-gray-700 hover:text-gray-900">
              <Search size={22} />
            </button>
            <Link to="/wishlist" className="text-gray-700 hover:text-gray-900">
              <Heart size={22} />
            </Link>
            <Link to="/cart" className="text-gray-700 hover:text-gray-900">
              <ShoppingCart size={22} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-gray-50 border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-2">
            <button
              onClick={() => setActiveTab('homes')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'homes'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              For Homes
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'business'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              For Businesses
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <ul className="hidden lg:flex items-center gap-8 py-3 text-sm font-medium">
            <li>
              <Link to="/category/living-room" className="text-gray-700 hover:text-red-500 transition-colors">
                Living room
              </Link>
            </li>
            <li>
              <Link to="/category/bedroom" className="text-gray-700 hover:text-red-500 transition-colors">
                Bedroom
              </Link>
            </li>
            <li>
              <Link to="/category/dining-room" className="text-gray-700 hover:text-red-500 transition-colors">
                Dining room
              </Link>
            </li>
            <li>
              <Link to="/category/office-study" className="text-gray-700 hover:text-red-500 transition-colors">
                Office and Study
              </Link>
            </li>
            <li>
              <Link to="/category/modular-kitchen" className="text-gray-700 hover:text-red-500 transition-colors">
                Modular Kitchens
              </Link>
            </li>
            <li>
              <Link to="/products" className="text-gray-700 hover:text-red-500 transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link to="/offers" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
                Offers
              </Link>
            </li>
          </ul>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 space-y-2">
              <Link
                to="/category/living-room"
                className="block py-2 text-gray-700 hover:text-red-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Living room
              </Link>
              <Link
                to="/category/bedroom"
                className="block py-2 text-gray-700 hover:text-red-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bedroom
              </Link>
              <Link
                to="/category/dining-room"
                className="block py-2 text-gray-700 hover:text-red-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dining room
              </Link>
              <Link
                to="/category/office-study"
                className="block py-2 text-gray-700 hover:text-red-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Office and Study
              </Link>
              <Link
                to="/category/modular-kitchen"
                className="block py-2 text-gray-700 hover:text-red-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Modular Kitchens
              </Link>
              <Link
                to="/products"
                className="block py-2 text-gray-700 hover:text-red-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                All Products
              </Link>
              <Link
                to="/offers"
                className="block py-2 text-red-500 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Offers
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
