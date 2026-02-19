import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { companyInfo, showrooms } from '../data/mockData';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded font-bold text-lg">
                HDE
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Home Decor</h3>
                <p className="text-xs text-gray-400">Enterprises</p>
              </div>
            </div>
            <p className="text-sm mb-2">{companyInfo.tagline}</p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="hover:text-red-500 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-red-500 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-red-500 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-red-500 transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-red-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/showrooms" className="hover:text-red-500 transition-colors">
                  Our Showrooms
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-red-500 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-red-500 transition-colors">
                  Special Offers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-red-500 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop By Category</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/category/living-room" className="hover:text-red-500 transition-colors">
                  Living Room
                </Link>
              </li>
              <li>
                <Link to="/category/bedroom" className="hover:text-red-500 transition-colors">
                  Bedroom
                </Link>
              </li>
              <li>
                <Link to="/category/dining-room" className="hover:text-red-500 transition-colors">
                  Dining Room
                </Link>
              </li>
              <li>
                <Link to="/category/office-study" className="hover:text-red-500 transition-colors">
                  Office & Study
                </Link>
              </li>
              <li>
                <Link to="/category/modular-kitchen" className="hover:text-red-500 transition-colors">
                  Modular Kitchen
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Phone size={16} className="mt-1 flex-shrink-0" />
                <div>
                  <p>{companyInfo.phone}</p>
                  <p className="text-xs text-gray-400">Mon-Sat: 10 AM - 8 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={16} className="mt-1 flex-shrink-0" />
                <p>{companyInfo.email}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white mb-1">Our Showrooms:</p>
                  <p className="text-xs">Rajpur Road, Dehradun</p>
                  <p className="text-xs">Saharanpur Road, Dehradun</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>
            &copy; {new Date().getFullYear()} {companyInfo.name}. All rights reserved. |
            Authorized Godrej Interio Channel Partner
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
