import React from 'react';
import { instagramPosts } from '../data/mockData';
import { Instagram } from 'lucide-react';

const InstagramSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Instagram size={32} className="text-pink-600" />
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800">
              Moments That Matter
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-4">
            Home Decor Enterprises in Everyday Living
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-700 font-semibold"
          >
            Follow us @homedecorenterprises
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {instagramPosts.map((post) => (
            <a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
            >
              <img
                src={post.image}
                alt="Instagram post"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <Instagram
                  size={40}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramSection;
