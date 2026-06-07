"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  businessId: string;
  initialIsFavorite: boolean;
}

export default function FavoriteButton({ businessId, initialIsFavorite }: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      if (res.ok) {
        setIsFavorite(!isFavorite);
        router.refresh();
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`btn btn-sm ${isFavorite ? "btn-primary" : "btn-outline"} min-w-[120px]`}
    >
      {isFavorite ? "❤️ Lagret" : "🤍 Lagre"}
    </button>
  );
}
