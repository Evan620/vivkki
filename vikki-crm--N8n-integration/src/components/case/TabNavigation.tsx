import { FileText, Car, Users, Scale, Heart, Shield, FolderOpen, Clock, StickyNote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'accident', label: 'Accident', icon: Car },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'defendant', label: 'Defendant', icon: Scale },
  { id: 'medical', label: 'Medical', icon: Heart },
  { id: 'insurance', label: 'Insurance', icon: Shield },
  { id: 'notes', label: 'Case Notes', icon: StickyNote },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'worklog', label: 'Work Log', icon: Clock }
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToTab = (index: number) => {
    if (scrollContainerRef.current) {
      const tabWidth = 120;
      scrollContainerRef.current.scrollTo({
        left: index * tabWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 mb-4 sm:mb-6 overflow-hidden">
      <div className="relative bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <button
          onClick={() => scrollTabs('left')}
          className="hidden lg:flex absolute left-0 top-0 bottom-0 w-8 lg:w-12 items-center justify-center bg-gradient-to-r from-white via-white/80 to-transparent z-10 hover:from-gray-50 transition-colors group"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide scroll-smooth px-2 sm:px-4 lg:px-12"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  scrollToTab(index);
                }}
                className={`
                  relative flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-300 min-w-fit
                  ${activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{activeTab === tab.id && tab.label}</span>

                {activeTab === tab.id && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 rounded-t-full animate-scale-in" />
                    <div className="absolute inset-0 bg-blue-600/5 rounded-t-lg" />
                  </>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scrollTabs('right')}
          className="hidden lg:flex absolute right-0 top-0 bottom-0 w-8 lg:w-12 items-center justify-center bg-gradient-to-l from-white via-white/80 to-transparent z-10 hover:from-gray-50 transition-colors group"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      <div className="flex lg:hidden justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 bg-gray-50">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
              scrollToTab(index);
            }}
            className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-blue-600 w-4 sm:w-6'
                : 'bg-gray-300 w-1 sm:w-1.5 hover:bg-gray-400'
            }`}
            aria-label={`Go to ${tab.label}`}
          />
        ))}
      </div>
    </div>
  );
}
