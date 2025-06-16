import React, { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title = 'Talnurt Recruitment Portal',
  description = 'Find your dream job with Talnurt Recruitment Portal'
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default PageLayout; 