import React from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { companyInfo, showrooms } from '../data/mockData';
import InquiryForm from '../components/InquiryForm';

const ContactPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Get In Touch
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to help you create the perfect living space
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Contact Information</h2>
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Phone size={24} className="text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Phone</p>
                  <p className="text-gray-600">{companyInfo.phone}</p>
                  <p className="text-sm text-gray-500">Mon-Sat: 10:00 AM - 8:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Mail size={24} className="text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Email</p>
                  <p className="text-gray-600">{companyInfo.email}</p>
                  <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <MessageSquare size={24} className="text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">WhatsApp</p>
                  <p className="text-gray-600">{companyInfo.whatsapp}</p>
                  <p className="text-sm text-gray-500">Quick responses on WhatsApp</p>
                </div>
              </div>
            </div>

            {/* Showrooms */}
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Our Showrooms</h3>
            <div className="space-y-6">
              {showrooms.map((showroom) => (
                <div key={showroom.id} className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Showroom {showroom.id}</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-red-500 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{showroom.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-red-500 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{showroom.phone}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={16} className="text-red-500 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{showroom.timing}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inquiry Form */}
          <div>
            <InquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
