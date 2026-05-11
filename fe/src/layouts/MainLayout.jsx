import React from 'react';

export default function MainLayout({ children, hasSidebar = false, maxWidth = 'max-w-7xl' }) {
  return (
    <div className={`flex-1 px-4 sm:px-8 pt-2 sm:pt-4 pb-20 ${hasSidebar ? 'sm:ml-64' : ''} mt-[56px] bg-[#f8fafc] min-h-screen relative`}>
      <div className={`${maxWidth} mx-auto space-y-4`}>
        {children}
      </div>
    </div>
  );
}
