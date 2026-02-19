import React from 'react';
import { Star } from 'lucide-react';
import { testimonials } from '../data/mockData';

const TestimonialCard = ({ testimonial }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
      <div className="flex gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} size={20} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-gray-700 mb-4 italic">"{testimonial.comment}"</p>
      <div className="border-t pt-4">
        <p className="font-semibold text-gray-800">{testimonial.name}</p>
        <p className="text-sm text-gray-600">{testimonial.location}</p>
      </div>
    </div>
  );
};

const Testimonials = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trusted by families across Dehradun since 2006
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
