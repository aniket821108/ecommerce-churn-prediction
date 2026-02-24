import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

// 📸 You can replace these image URLs with your own Cloudinary links later!
const banners = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    title: "Super Sale is Live!",
    subtitle: "Up to 50% off on Electronics",
    link: "/shop?category=electronics",
    color: "text-white"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    title: "New Fashion Collection",
    subtitle: "Discover the latest trends",
    link: "/shop?category=clothing",
    color: "text-white"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
    title: "Books for Everyone",
    subtitle: "Grab your next read today",
    link: "/shop?category=books",
    color: "text-white"
  }
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  // ⚡ Auto-slide functionality (Change every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrent(current === banners.length - 1 ? 0 : current + 1);
  };

  const prevSlide = () => {
    setCurrent(current === 0 ? banners.length - 1 : current - 1);
  };

  return (
    <div className="relative w-full h-[250px] md:h-[450px] overflow-hidden rounded-xl mb-8 shadow-xl group">
      
      {/* 🖼️ Slides Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="w-full h-full flex-shrink-0 relative">
            <img 
              src={banner.image} 
              alt={banner.title} 
              className="w-full h-full object-cover"
            />
            
            {/* 🌑 Dark Gradient Overlay for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex flex-col justify-center items-start px-8 md:px-24">
              <h2 className={`text-3xl md:text-6xl font-bold mb-4 ${banner.color} drop-shadow-lg animate-fade-in-up`}>
                {banner.title}
              </h2>
              <p className={`text-lg md:text-2xl mb-8 ${banner.color} drop-shadow-md opacity-90`}>
                {banner.subtitle}
              </p>
              <Link 
                to={banner.link}
                className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105 shadow-lg"
              >
                Shop Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ⬅️ Left Arrow */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/90 p-3 rounded-full shadow-lg backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        <ChevronLeftIcon className="h-6 w-6 text-gray-900" />
      </button>

      {/* ➡️ Right Arrow */}
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/90 p-3 rounded-full shadow-lg backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        <ChevronRightIcon className="h-6 w-6 text-gray-900" />
      </button>

      {/* 🔘 Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              current === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;