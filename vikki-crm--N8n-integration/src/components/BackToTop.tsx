import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-50 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg sm:shadow-xl lg:shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center group hover:scale-110 animate-fade-in"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}
    </>
  );
}
