"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";

interface Business {
  id: string;
  name: string | null;
  description: string | null;
  categoryId: string | null;
  logo: string | null;
  images: string[];
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bookingLink: string | null;
  mapLink: string | null;
  openingHours: any;
  status: string;
}

interface Category {
  id: string;
  name: string;
}

interface BusinessFormProps {
  business: Business | null;
  categories: Category[];
}

const defaultOpeningHours = {
  monday: { open: "09:00", close: "17:00", closed: false },
  tuesday: { open: "09:00", close: "17:00", closed: false },
  wednesday: { open: "09:00", close: "17:00", closed: false },
  thursday: { open: "09:00", close: "17:00", closed: false },
  friday: { open: "09:00", close: "17:00", closed: false },
  saturday: { open: "10:00", close: "14:00", closed: false },
  sunday: { open: "", close: "", closed: true },
};

export default function BusinessForm({ business, categories }: BusinessFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: business?.name || "",
    description: business?.description || "",
    categoryId: business?.categoryId || "",
    logo: business?.logo || "",
    images: business?.images || [],
    address: business?.address || "",
    latitude: business?.latitude || null as number | null,
    longitude: business?.longitude || null as number | null,
    phone: business?.phone || "",
    email: business?.email || "",
    website: business?.website || "",
    bookingLink: business?.bookingLink || "",
    mapLink: business?.mapLink || "",
    openingHours: business?.openingHours || defaultOpeningHours,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/business", {
        method: business ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred");
      } else {
        router.refresh();
        alert(business ? "Profile updated successfully!" : "Profile created successfully! Awaiting admin approval.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpeningHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      openingHours: {
        ...formData.openingHours,
        [day]: {
          ...formData.openingHours[day],
          [field]: value,
        },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium animate-scale-in">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {business && business.status === "PENDING" && (
        <div className="bg-amber-50/80 backdrop-blur-sm border-2 border-amber-200 text-amber-800 px-5 py-4 rounded-xl text-sm font-medium animate-scale-in">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Profilen din venter på godkjenning fra administrator</span>
          </div>
        </div>
      )}

      {business && business.status === "REJECTED" && (
        <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium animate-scale-in">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>Profilen din ble avvist. Vennligst oppdater og send inn på nytt.</span>
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="space-y-6">
        <h3 className="section-subtitle border-b border-gray-200 pb-3">
          Grunnleggende informasjon
        </h3>

        <div>
          <label className="label">
            Bedriftsnavn
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            placeholder="Navnet på bedriften din"
          />
        </div>

        <div>
          <label className="label">
            Beskrivelse
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input min-h-[120px]"
            rows={4}
            placeholder="Fortell kundene om bedriften din..."
          />
        </div>

        <div>
          <label className="label">
            Kategori
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="input"
          >
            <option value="">Velg en kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Section */}
      <div className="space-y-6">
        <h3 className="section-subtitle border-b border-gray-200 pb-3">
          Bilder og media
        </h3>

        <div>
          <label className="label">Logo</label>
          <p className="text-sm text-gray-500 mb-4">Last opp bedriftens logo (anbefalt: 400x400px)</p>
          <CldUploadWidget
            uploadPreset="dinlinks"
            onSuccess={(result: any) => {
              setFormData({ ...formData, logo: result.info.secure_url });
            }}
          >
            {({ open }) => (
              <div>
                <button type="button" onClick={() => open()} className="btn btn-secondary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Last opp logo
                </button>
                {formData.logo && (
                  <div className="mt-6 inline-block">
                    <div className="relative group">
                      <Image src={formData.logo} alt="Logo" width={120} height={120} className="rounded-2xl shadow-soft border-2 border-gray-100" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo: "" })}
                          className="btn btn-sm bg-white text-red-600 hover:bg-red-50"
                        >
                          Fjern
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CldUploadWidget>
        </div>

        <div>
          <label className="label">Galleribilder</label>
          <p className="text-sm text-gray-500 mb-4">Last opp bilder av bedriften, produkter eller tjenester</p>
          <CldUploadWidget
            uploadPreset="dinlinks"
            onSuccess={(result: any) => {
              setFormData({
                ...formData,
                images: [...formData.images, result.info.secure_url],
              });
            }}
          >
            {({ open }) => (
              <div>
                <button type="button" onClick={() => open()} className="btn btn-secondary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Legg til bilde
                </button>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <Image src={image} alt={`Galleri ${index}`} width={200} height={200} className="rounded-xl shadow-soft border border-gray-100 w-full h-32 object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              images: formData.images.filter((_, i) => i !== index),
                            });
                          }}
                          className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-medium opacity-0 group-hover:opacity-100 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CldUploadWidget>
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-6">
        <h3 className="section-subtitle border-b border-gray-200 pb-3">
          Plassering
        </h3>

        <div>
          <label className="label">Adresse</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="input"
            placeholder="Gateadresse, postnummer og sted"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Breddegrad</label>
            <input
              type="number"
              step="any"
              value={formData.latitude || ""}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
              className="input"
              placeholder="59.9139"
            />
          </div>
          <div>
            <label className="label">Lengdegrad</label>
            <input
              type="number"
              step="any"
              value={formData.longitude || ""}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })}
              className="input"
              placeholder="10.7522"
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-6">
        <h3 className="section-subtitle border-b border-gray-200 pb-3">
          Kontaktinformasjon
        </h3>

        <div>
          <label className="label">Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input"
            placeholder="+47 123 45 678"
          />
        </div>

        <div>
          <label className="label">E-post</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input"
            placeholder="kontakt@bedrift.no"
          />
        </div>

        <div>
          <label className="label">Nettside</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="input"
            placeholder="https://www.bedrift.no"
          />
        </div>

        <div>
          <label className="label">Bookinglink</label>
          <input
            type="url"
            value={formData.bookingLink}
            onChange={(e) => setFormData({ ...formData, bookingLink: e.target.value })}
            className="input"
            placeholder="https://booking.bedrift.no"
          />
        </div>

        <div>
          <label className="label">Kartlink</label>
          <input
            type="url"
            value={formData.mapLink}
            onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
            className="input"
            placeholder="https://maps.google.com/..."
          />
        </div>
      </div>

      {/* Opening Hours Section - "Åpningstid" */}
      <div className="space-y-6">
        <h3 className="section-subtitle border-b border-gray-200 pb-3">
          Åpningstid
        </h3>
        <div className="space-y-4">
          {Object.entries(formData.openingHours).map(([day, hours]: [string, any]) => (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
              <span className="w-28 capitalize font-semibold text-gray-900">{day}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hours.closed}
                  onChange={(e) => handleOpeningHoursChange(day, "closed", e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-600">Stengt</span>
              </label>
              {!hours.closed && (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleOpeningHoursChange(day, "open", e.target.value)}
                    className="input py-2 px-3 text-sm flex-1"
                  />
                  <span className="text-gray-400 font-medium">-</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleOpeningHoursChange(day, "close", e.target.value)}
                    className="input py-2 px-3 text-sm flex-1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Lagrer...
            </span>
          ) : business ? (
            "Oppdater profil"
          ) : (
            "Opprett profil"
          )}
        </button>
      </div>
    </form>
  );
}
