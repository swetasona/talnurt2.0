import React, { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="h-screen flex flex-col justify-center items-center overflow-hidden bg-gray-50">
      <div className="w-full max-w-xl py-6 px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {title}
        </h2>
        {subtitle && (
          <p className="text-gray-600 mb-8 text-center text-lg">
            {subtitle}
          </p>
        )}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 