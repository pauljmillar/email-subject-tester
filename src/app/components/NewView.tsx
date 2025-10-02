'use client';

export default function NewView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#202123]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#343541] rounded-full">
          <svg className="w-8 h-8 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[#ECECF1] mb-4">New</h1>
        <p className="text-[#ECECF1]/70 text-lg">This feature is coming soon</p>
      </div>
    </div>
  );
}
