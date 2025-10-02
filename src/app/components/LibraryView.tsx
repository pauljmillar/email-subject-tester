'use client';

export default function LibraryView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#202123]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#343541] rounded-full">
          <svg className="w-8 h-8 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[#ECECF1] mb-4">Library</h1>
        <p className="text-[#ECECF1]/70 text-lg">This feature is coming soon</p>
      </div>
    </div>
  );
}
