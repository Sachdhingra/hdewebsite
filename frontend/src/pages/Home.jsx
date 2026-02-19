import React, { useState, useEffect } from 'react';
import HeroCarousel from '../components/HeroCarousel';
import CategoryGrid from '../components/CategoryGrid';
import FeaturedProducts from '../components/FeaturedProducts';
import ShowroomsSection from '../components/ShowroomsSection';
import Testimonials from '../components/Testimonials';
import InstagramSection from '../components/InstagramSection';
import InquiryForm from '../components/InquiryForm';

const Home = () => {
  return (
    <div>
      <HeroCarousel />
      <CategoryGrid />
      <FeaturedProducts />
      <ShowroomsSection />
      <Testimonials />
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
                Ready to Transform Your Space?
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Get in touch with our expert team for personalized furniture solutions. 
                We offer free design consultations and competitive pricing on all Godrej Interio products.
              </p>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">✓</span>
                  Free Home Design Consultation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">✓</span>
                  No Cost EMI Available
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">✓</span>
                  Installation & Warranty Support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">✓</span>
                  Authorized Godrej Interio Partner Since 2006
                </li>
              </ul>
            </div>
            <div>
              <InquiryForm />
            </div>
          </div>
        </div>
      </section>

      <InstagramSection />
    </div>
  );
};

export default Home;
