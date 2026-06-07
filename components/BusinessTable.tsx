"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Business {
  id: string;
  name: string;
  status: string;
  user: {
    email: string;
  };
  category: {
    name: string;
  };
  createdAt: Date;
}

interface BusinessTableProps {
  businesses: Business[];
}

export default function BusinessTable({ businesses }: BusinessTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");

  const filteredBusinesses = businesses.filter((business) => {
    if (filter === "all") return true;
    return business.status === filter.toUpperCase();
  });

  const handleApprove = async (id: string) => {
    const res = await fetch(`/api/admin/businesses/${id}/approve`, {
      method: "POST",
    });

    if (res.ok) {
      router.refresh();
    }
  };

  const handleReject = async (id: string) => {
    const res = await fetch(`/api/admin/businesses/${id}/reject`, {
      method: "POST",
    });

    if (res.ok) {
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this business?")) {
      return;
    }

    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`btn ${filter === "all" ? "btn-primary" : "btn-outline"}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`btn ${filter === "pending" ? "btn-primary" : "btn-outline"}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`btn ${filter === "approved" ? "btn-primary" : "btn-outline"}`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`btn ${filter === "rejected" ? "btn-primary" : "btn-outline"}`}
        >
          Rejected
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Business Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Owner
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBusinesses.map((business) => (
              <tr key={business.id}>
                <td className="px-4 py-4 text-sm text-gray-900">{business.name}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{business.category.name}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{business.user.email}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      business.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : business.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {business.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {new Date(business.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex gap-2">
                    {business.status !== "APPROVED" && (
                      <button
                        onClick={() => handleApprove(business.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Approve
                      </button>
                    )}
                    {business.status !== "REJECTED" && (
                      <button
                        onClick={() => handleReject(business.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(business.id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
