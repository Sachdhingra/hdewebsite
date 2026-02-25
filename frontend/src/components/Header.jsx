import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, MapPin, Phone, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('homes');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [categories, setCategories] = useState([]);
  
  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
  const cartCount = cartItems.length;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/categories/hierarchy`);
      if (response.data.success) {
        setCategories(response.data.hierarchy);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryClick = (slug) => {
    setHoveredCategory(null);
    setHoveredGroup(null);
    navigate(`/category/${slug}`);
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-800 text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link to="/become-dealer" className="hover:text-gray-300 transition-colors">
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

          {/* Desktop Navigation Icons */}
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
                activeTab === 'homes' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              For Homes
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'business' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              For Businesses
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-white border-b border-gray-200 relative">
        <div className="container mx-auto px-4">
          <ul className="hidden lg:flex items-center gap-8 py-3 text-sm font-medium">
            {categories.map((category) => (
              <li
                key={category.slug}
                className="relative"
                onMouseEnter={() => {
                  setHoveredCategory(category.slug);
                  // Auto-select first group if exists
                  if (category.groups?.length > 0) {
                    setHoveredGroup(category.groups[0].slug);
                  } else {
                    setHoveredGroup(null);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredCategory(null);
                  setHoveredGroup(null);
                }}
              >
                <Link
                  to={`/category/${category.slug}`}
                  className={`flex items-center gap-1 transition-colors ${
                    hoveredCategory === category.slug ? 'text-red-500' : 'text-gray-700 hover:text-red-500'
                  }`}
                >
                  {category.name}
                  {(category.groups?.length > 0 || category.subcategories?.length > 0) && (
                    <ChevronDown size={14} />
                  )}
                </Link>

                {/* Mega Menu Dropdown - Interio Style */}
                {hoveredCategory === category.slug && 
                 (category.groups?.length > 0 || category.subcategories?.length > 0) && (
                  <div 
                    className="absolute top-full left-0 mt-0 bg-white shadow-2xl border border-gray-100 z-50"
                    style={{ minWidth: '800px' }}
                  >
                    <div className="flex">
                      {/* Left Sidebar - Groups */}
                      {category.groups?.length > 0 && (
                        <div className="w-56 bg-gray-50 border-r border-gray-200 py-4">
                          <div className="px-4 pb-2 text-xs font-semibold text-gray-400 uppercase">
                            {category.name}
                          </div>
                          {category.groups.map((group) => (
                            <div
                              key={group.slug}
                              onMouseEnter={() => setHoveredGroup(group.slug)}
                              className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                                hoveredGroup === group.slug 
                                  ? 'bg-white text-red-500 border-l-4 border-red-500' 
                                  : 'text-gray-700 hover:bg-white'
                              }`}
                            >
                              <span className="font-medium">{group.name}</span>
                              {group.subcategories?.length > 0 && (
                                <ChevronRight size={16} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Right Side - Subcategory Thumbnails */}
                      <div className="flex-1 p-6">
                        {category.groups?.map((group) => (
                          hoveredGroup === group.slug && group.subcategories?.length > 0 && (
                            <div key={group.slug}>
                              <div className="grid grid-cols-3 gap-4">
                                {group.subcategories.map((subcat) => (
                                  <Link
                                    key={subcat.slug}
                                    to={`/category/${subcat.slug}`}
                                    onClick={() => handleCategoryClick(subcat.slug)}
                                    className="group block"
                                  >
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                                      {subcat.image ? (
                                        <img
                                          src={subcat.image}
                                          alt={subcat.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <span className="text-4xl">🛋️</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-800 group-hover:text-red-500 font-medium">
                                        {subcat.name}
                                      </span>
                                      <ChevronRight size={16} className="text-gray-400 group-hover:text-red-500" />
                                    </div>
                                    {subcat.productCount > 0 && (
                                      <span className="text-xs text-gray-500">
                                        {subcat.productCount} products
                                      </span>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )
                        ))}

                        {/* Direct subcategories (no groups) */}
                        {!category.groups?.length && category.subcategories?.length > 0 && (
                          <div className="grid grid-cols-3 gap-4">
                            {category.subcategories.map((subcat) => (
                              <Link
                                key={subcat.slug}
                                to={`/category/${subcat.slug}`}
                                onClick={() => handleCategoryClick(subcat.slug)}
                                className="group block"
                              >
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                                  {subcat.image ? (
                                    <img
                                      src={subcat.image}
                                      alt={subcat.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <span className="text-4xl">🪑</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-800 group-hover:text-red-500 font-medium">
                                    {subcat.name}
                                  </span>
                                  <ChevronRight size={16} className="text-gray-400 group-hover:text-red-500" />
                                </div>
                                {subcat.productCount > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {subcat.productCount} products
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View All Link */}
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <Link
                        to={`/category/${category.slug}`}
                        onClick={() => handleCategoryClick(category.slug)}
                        className="text-red-500 hover:text-red-600 font-medium text-sm flex items-center gap-1"
                      >
                        View All {category.name}
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            ))}
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
            <div className="lg:hidden py-4 space-y-2 max-h-[70vh] overflow-y-auto">
              {categories.map((category) => (
                <div key={category.slug} className="border-b border-gray-100 pb-3">
                  <Link
                    to={`/category/${category.slug}`}
                    className="block py-2 text-gray-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                  {category.groups?.map((group) => (
                    <div key={group.slug} className="pl-4">
                      <div className="py-1 text-sm text-gray-500 font-medium">{group.name}</div>
                      <div className="pl-4 space-y-1">
                        {group.subcategories?.map((subcat) => (
                          <Link
                            key={subcat.slug}
                            to={`/category/${subcat.slug}`}
                            className="block py-1 text-sm text-gray-600 hover:text-red-500"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subcat.name} {subcat.productCount > 0 && `(${subcat.productCount})`}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
