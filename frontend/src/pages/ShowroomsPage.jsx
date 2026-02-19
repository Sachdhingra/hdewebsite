import React from 'react';
import { showrooms } from '../data/mockData';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import { Button } from '../components/ui/button';
import InquiryForm from '../components/InquiryForm';

const ShowroomsPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Visit Our Showrooms
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the finest Godrej Interio furniture collection at our premium showrooms in Dehradun
          </p>
        </div>
      </div>

      {/* Showrooms Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {showrooms.map((showroom) => (
            <div key={showroom.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Showroom Image */}
              <div className="h-64 bg-gradient-to-r from-red-100 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-full inline-block mb-4">
                    <MapPin size={48} className="text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Showroom {showroom.id}</h3>
                </div>
              </div>

              {/* Showroom Details */}
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{showroom.name}</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-4">
                    <MapPin size={24} className="text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800 mb-1">Address</p>
                      <p className="text-gray-600">{showroom.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone size={24} className="text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800 mb-1">Phone</p>
                      <p className="text-gray-600">{showroom.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail size={24} className="text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800 mb-1">Email</p>
                      <p className="text-gray-600">{showroom.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock size={24} className="text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800 mb-1">Opening Hours</p>
                      <p className="text-gray-600">{showroom.timing}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => window.open(showroom.mapUrl, '_blank')}
                    className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 justify-center"
                  >
                    <Navigation size={18} />
                    Get Directions
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50"
                  >
                    Schedule Visit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Have Questions? Let's Talk!
              </h2>
              <p className="text-gray-600">
                Our team is ready to help you find the perfect furniture for your space
              </p>
            </div>
            <InquiryForm />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShowroomsPage;
