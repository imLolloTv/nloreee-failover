"use client";

import { useLoading } from "@/app/components/LoadingProvider";

export default function ClientPage({ children }: { children: React.ReactNode }) {
  const loading = useLoading();
  if (loading) return null;
  return children;
}
