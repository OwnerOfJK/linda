'use client';

import { ReactNode } from 'react';
import ClientAuthHandler from './ClientAuthHandler';

export default function ClientAuthProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <>
      <ClientAuthHandler />
      {children}
    </>
  );
} 