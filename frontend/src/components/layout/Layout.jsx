import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="ml-64 p-8 flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;