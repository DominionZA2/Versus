'use client';

import { useEffect } from 'react';
import { storage } from '@/lib/storage';

export default function DataHydrator() {
  useEffect(() => {
    storage.hydrate();
  }, []);

  return null;
}
