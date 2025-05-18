import React from 'react';
import { Outlet } from 'react-router-dom'; // Outlet renders the matched child route component

// Import components like Navbar or Footer if you have them
// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    // If Tailwind isn't working, these classes won't apply, but content should still show
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Optional Navbar */}
      {/* <Navbar /> */}

      {/* Main content area where nested routes will be rendered */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-2">MainLayout Loaded</h1> {/* TEMPORARY: For debugging */}
        <Outlet /> {/* Child route components render here */}
      </main>

      {/* Optional Footer */}
      {/* <Footer /> */}
    </div>
  );
};

export default MainLayout;
