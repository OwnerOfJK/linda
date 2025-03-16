'use client';

import { ReactNode } from 'react';
import ClientAuthHandler from './ClientAuthHandler';

interface ClientWrapperProps {
  children: ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <>
      <ClientAuthHandler />
      {children}
    </>
  );
} 