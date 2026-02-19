import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { showrooms } from '../data/mockData';
import { Button } from './ui/button';

const ShowroomCard = ({ showroom }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{showroom.name}</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <MapPin size={20} className="text-red-500 flex-shrink-0 mt-1" />
          <p className="text-gray-700">{showroom.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <Phone size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-gray-700">{showroom.phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-gray-700">{showroom.email}</p>
        </div>
        <div className="flex items-start gap-3">
          <Clock size={20} className="text-red-500 flex-shrink-0 mt-1" />
          <p className="text-gray-700">{showroom.timing}</p>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <Button
          onClick={() => window.open(showroom.mapUrl, '_blank')}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
        >
          Get Directions
        </Button>
        <Button
          variant="outline"
          className="w-full border-red-500 text-red-500 hover:bg-red-50"
        >
          Schedule Visit
        </Button>
      </div>
    </div>
  );
};

const ShowroomsSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
            Visit Our Showrooms
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience premium Godrej Interio furniture at our showrooms in Dehradun
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {showrooms.map((showroom) => (
            <ShowroomCard key={showroom.id} showroom={showroom} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShowroomsSection;
