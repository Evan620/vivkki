export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-10 sm:h-12 bg-gray-200 rounded-lg sm:rounded-xl w-full max-w-md"></div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 border border-gray-100">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-2 sm:mb-3"></div>
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 mb-1 sm:mb-2"></div>
            <div className="h-2 sm:h-3 bg-gray-200 rounded w-10 sm:w-12"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 border border-gray-100">
            <div className="h-1.5 bg-gray-200 rounded mb-3 sm:mb-4"></div>
            <div className="space-y-2 sm:space-y-3">
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="h-14 sm:h-16 bg-gray-100 rounded-lg"></div>
                <div className="h-14 sm:h-16 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="h-8 sm:h-10 bg-gray-200 rounded-lg mt-3 sm:mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
