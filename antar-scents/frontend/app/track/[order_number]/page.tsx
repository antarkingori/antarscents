'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Redirect /track/12345 → /track so the main page handles it with the form pre-filled
export default function TrackRedirect() {
  const { order_number } = useParams<{ order_number: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace('/track');
  }, [order_number, router]);

  return null;
}
