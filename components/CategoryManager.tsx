"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    businesses: number;
  };
}

interface CategoryManagerProps {
  categories: Category[];
}

export default function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const t = useTranslations("categoryManager");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setName("");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  return (
    <div>
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("addNew")}</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className="input flex-1"
            required
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {t("addButton")}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("allCategories")}</h2>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{category.name}</p>
                <p className="text-sm text-gray-600">
                  {category._count.businesses} {category._count.businesses === 1 ? t("businessSingular") : t("businessPlural")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-800"
                disabled={category._count.businesses > 0}
              >
                {t("delete")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
