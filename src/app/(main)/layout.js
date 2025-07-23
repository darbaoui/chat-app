// app/(main)/layout.js

'use client'; // This is essential for using hooks like useAuth

import BarTop from '@/components/BarTop';
import { useAuth } from '@/hooks/useAuth'; // Adjust the import path
import { useRouter } from 'next/navigation';
import { createContext, useEffect } from 'react';
export const AuthAppContext = createContext(null);
export default function MainAppLayout({ children }) {
  const { user } = useAuth({ middleware: 'auth' });
  //   const router = useRouter();

  //   useEffect(() => {
  //     // If loading is finished and there's no user, redirect to login
  //     if (!isLoading && !user) {
  //       router.push('/auth/login');
  //     }
  //   }, [user, isLoading, router]);

  // While checking for auth, you can show a loader
  if (!user) {
    return (
      <div className='w-screen h-screen flex items-center justify-center'>
        App Loading...
      </div>
    ); // Or a full-page spinner component
  }

  // If authenticated, render the layout with the page content
  return (
    <AuthAppContext.Provider value={{ user }}>
      <div className='flex w-full flex-col h-screen'>
        {/* <main className='flex flex-col h-screen items-center justify-center py-0 md:py-8 overflow-hidden'> */}
        <BarTop />
        <div className='w-full'>{children}</div>
        {/* </main> */}
      </div>
    </AuthAppContext.Provider>
  );
}
