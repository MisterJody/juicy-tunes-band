
import React from 'react';

export const LoadingScreen = () => {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p>Loading your music library...</p>
      </div>
    </div>
  );
};
