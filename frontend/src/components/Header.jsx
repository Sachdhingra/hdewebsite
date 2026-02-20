import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, MapPin, Phone, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { subcategories } from '../data/subcategories';

const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('homes');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  
  // Get cart count from localStorage
  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartCount = cartItems.length;

  const mainCategories = [
    { name: 'Living room', slug: 'living-room' },
    { name: 'Bedroom', slug: 'bedroom' },
    { name: 'Dining room', slug: 'dining-room' },
    { name: 'Office and Study', slug: 'office-study' },
    { name: 'Modular Kitchens', slug: 'modular-kitchen' },
    { name: 'All Products', slug: 'all' }
  ];

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
            <Link to="/cart" className="text-gray-700 hover:text-gray-900 relative">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {cartCount}
                </span>
              )}
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

      {/* Navigation Menu with Mega Dropdown */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <ul className="hidden lg:flex items-center gap-8 py-3 text-sm font-medium relative">
            {mainCategories.map((category) => (
              <li
                key={category.slug}
                className="relative"
                onMouseEnter={() => setHoveredCategory(category.slug)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  to={`/category/${category.slug}`}
                  className="text-gray-700 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  {category.name}
                  {subcategories[category.slug] && <ChevronDown size={14} />}
                </Link>

                {/* Mega Dropdown */}
                {subcategories[category.slug] && hoveredCategory === category.slug && (
                  <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg p-6 min-w-[300px] z-50">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {subcategories[category.slug].map((subcat) => (
                        <Link
                          key={subcat.slug}
                          to={`/category/${category.slug}/${subcat.slug}`}
                          className="flex items-center gap-2 p-2 rounded hover:bg-red-50 transition-colors"
                          onClick={() => setHoveredCategory(null)}
                        >
                          <span className="text-xl">{subcat.icon}</span>
                          <span className="text-sm text-gray-700 hover:text-red-500">
                            {subcat.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
            <li>
              <Link to="/offers" className="text-red-500 font-semibold hover:text-red-600 transition-colors">
                Offers
              </Link>
            </li>
          </ul>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 space-y-2">
              {mainCategories.map((category) => (
                <div key={category.slug}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="block py-2 text-gray-700 hover:text-red-500 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                  {subcategories[category.slug] && (
                    <div className="pl-4 space-y-1">
                      {subcategories[category.slug].map((subcat) => (
                        <Link
                          key={subcat.slug}
                          to={`/category/${category.slug}/${subcat.slug}`}
                          className="block py-1 text-sm text-gray-600 hover:text-red-500"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subcat.icon} {subcat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Link
                to="/offers"
                className="block py-2 text-red-500 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Offers
              </Link>
              <Link
                to="/cart"
                className="block py-2 text-gray-700 font-medium flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingCart size={18} />
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
