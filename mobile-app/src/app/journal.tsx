import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useLocalDb } from '@/hooks/use-local-db';

export default function JournalRedirect() {
  const router = useRouter();
  const { setActiveTabRoute } = useLocalDb();

  useEffect(() => {
    setActiveTabRoute('/journal');
    router.replace('/');
  }, []);

  return null;
}
