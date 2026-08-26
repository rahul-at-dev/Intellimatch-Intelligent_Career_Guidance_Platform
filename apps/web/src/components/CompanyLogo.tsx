"use client";

import React, { useState } from "react";

interface CompanyLogoProps {
  name: string;
  website?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const BRAND_PALETTES: Record<string, { bg: string; text: string; gradient: string }> = {
  google: { bg: "#4285F4", text: "#FFFFFF", gradient: "from-blue-500 via-red-500 to-amber-500" },
  microsoft: { bg: "#00A4EF", text: "#FFFFFF", gradient: "from-blue-600 to-teal-500" },
  amazon: { bg: "#FF9900", text: "#111827", gradient: "from-amber-500 to-orange-600" },
  meta: { bg: "#0668E1", text: "#FFFFFF", gradient: "from-blue-600 to-indigo-700" },
  apple: { bg: "#000000", text: "#FFFFFF", gradient: "from-slate-800 to-slate-950" },
  netflix: { bg: "#E50914", text: "#FFFFFF", gradient: "from-red-600 to-rose-900" },
  nvidia: { bg: "#76B900", text: "#FFFFFF", gradient: "from-emerald-600 to-green-700" },
  adobe: { bg: "#FF0000", text: "#FFFFFF", gradient: "from-red-500 to-pink-600" },
  salesforce: { bg: "#00A1E0", text: "#FFFFFF", gradient: "from-cyan-500 to-blue-600" },
  atlassian: { bg: "#0052CC", text: "#FFFFFF", gradient: "from-blue-600 to-indigo-800" },
  goldman: { bg: "#1D4ED8", text: "#FFFFFF", gradient: "from-blue-700 to-slate-900" },
  flipkart: { bg: "#2874F0", text: "#FFFFFF", gradient: "from-blue-500 to-amber-400" },
  swiggy: { bg: "#FC8019", text: "#FFFFFF", gradient: "from-orange-500 to-amber-600" },
  zomato: { bg: "#CB202D", text: "#FFFFFF", gradient: "from-red-600 to-rose-700" },
  razorpay: { bg: "#0C2340", text: "#FFFFFF", gradient: "from-blue-900 to-cyan-700" },
  phonepe: { bg: "#6739B7", text: "#FFFFFF", gradient: "from-purple-700 to-indigo-800" },
  tcs: { bg: "#0A2540", text: "#FFFFFF", gradient: "from-slate-800 to-indigo-900" },
  infosys: { bg: "#007CC3", text: "#FFFFFF", gradient: "from-blue-600 to-sky-700" },
  zoho: { bg: "#E42528", text: "#FFFFFF", gradient: "from-red-600 via-amber-500 to-blue-600" },
};

function getInitials(name: string): string {
  if (!name) return "CO";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CO";
  if (parts.length === 1) {
    return (parts[0] || "CO").slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "CO";
}


function extractDomain(website?: string, name?: string): string {
  if (website) {
    try {
      const url = website.startsWith("http") ? website : `https://${website}`;
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      return hostname;
    } catch {
      // ignore
    }
  }
  if (!name) return "example.com";
  const cleaned = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleaned}.com`;
}

export function CompanyLogo({ name, website, size = "md", className = "" }: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-20 h-20 text-xl font-bold",
  };

  const domain = extractDomain(website, name);
  const initials = getInitials(name);
  const normalizedKey = Object.keys(BRAND_PALETTES).find((k) =>
    name.toLowerCase().includes(k)
  );
  const palette = normalizedKey ? BRAND_PALETTES[normalizedKey] : null;

  // Fallback Initials Avatar
  const renderFallback = () => (
    <div
      className={`flex items-center justify-center font-bold rounded-2xl shadow-sm transition-transform duration-200 select-none ${
        sizeClasses[size]
      } ${
        palette
          ? `bg-gradient-to-br ${palette.gradient} text-white`
          : "bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-900 text-white"
      } ${className}`}
      title={name}
      aria-label={`${name} logo initials`}
    >
      <span>{initials}</span>
    </div>
  );

  if (imageError) {
    return renderFallback();
  }

  const logoUrl = `https://logo.clearbit.com/${domain}`;

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-white border border-slate-200/80 p-1.5 shadow-sm overflow-hidden flex-shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={`${name} official logo`}
        className="w-full h-full object-contain"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
}
