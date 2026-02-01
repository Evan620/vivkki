export default function CaseDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white border-b border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 rounded-lg sm:rounded-xl">
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32 mb-3 sm:mb-4"></div>
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64 mb-2 sm:mb-3"></div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 sm:w-40"></div>
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-24 sm:w-32"></div>
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-24 sm:w-32"></div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-100 mb-4 sm:mb-6">
        <div className="flex gap-2 sm:gap-4 p-2 sm:p-4 border-b border-gray-100 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-8 sm:h-10 bg-gray-200 rounded w-20 sm:w-24 flex-shrink-0"></div>
          ))}
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6">
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mb-2"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-12 sm:w-16 mb-1"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-10 sm:w-12"></div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100">
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 sm:w-40 mb-3 sm:mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
