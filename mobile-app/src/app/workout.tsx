import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useLocalDb } from '@/hooks/use-local-db';

export default function WorkoutRedirect() {
  const router = useRouter();
  const { setActiveTabRoute } = useLocalDb();

  useEffect(() => {
    setActiveTabRoute('/workout');
    router.replace('/');
  }, []);

  return null;
}
