// app/(main)/layout.js

'use client'; // This is essential for using hooks like useAuth

import BarTop from '@/components/BarTop';
import { AuthAppContext } from '@/contexts/auth-context';
import { useAuth } from '@/hooks/useAuth'; // Adjust the import path

export default function MainAppLayout({ children }) {
  const { user } = useAuth({ middleware: 'auth' });

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
        <BarTop />
        <div className='w-full'>{children}</div>
      </div>
    </AuthAppContext.Provider>
  );
}
