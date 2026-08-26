import { ReactNode } from "react";
import clsx from "clsx";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200/85 bg-white/95 backdrop-blur-sm p-6 shadow-[0_4px_20px_-4px_rgba(107,63,240,0.05),0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-brand-200/80 hover:shadow-[0_8px_30px_-4px_rgba(107,63,240,0.09)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "green" | "amber" | "slate" | "sky" | "indigo";
  icon?: React.ElementType;
}) {
  const toneClasses: Record<string, { badge: string; iconBg: string; text: string }> = {
    brand: {
      badge: "text-brand-700 bg-brand-50 border border-brand-200/60",
      iconBg: "bg-brand-50 text-brand-600",
      text: "text-brand-600",
    },
    indigo: {
      badge: "text-indigo-700 bg-indigo-50 border border-indigo-200/60",
      iconBg: "bg-indigo-50 text-indigo-600",
      text: "text-indigo-600",
    },
    green: {
      badge: "text-emerald-700 bg-emerald-50 border border-emerald-200/60",
      iconBg: "bg-emerald-50 text-emerald-600",
      text: "text-emerald-600",
    },
    amber: {
      badge: "text-amber-700 bg-amber-50 border border-amber-200/60",
      iconBg: "bg-amber-50 text-amber-600",
      text: "text-amber-600",
    },
    sky: {
      badge: "text-sky-700 bg-sky-50 border border-sky-200/60",
      iconBg: "bg-sky-50 text-sky-600",
      text: "text-sky-600",
    },
    slate: {
      badge: "text-slate-700 bg-slate-100 border border-slate-200/60",
      iconBg: "bg-slate-100 text-slate-600",
      text: "text-slate-600",
    },
  };

  const currentTone = toneClasses[tone] ?? toneClasses["brand"]!;

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          {Icon && (
            <div className={clsx("flex h-8 w-8 items-center justify-center rounded-lg", currentTone.iconBg)}>
              <Icon size={16} />
            </div>
          )}
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
      {hint && (
        <div className="mt-4">
          <span className={clsx("pill", currentTone.badge)}>
            {hint}
          </span>
        </div>
      )}
    </Card>
  );
}

export function Pill({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "red" | "amber" | "brand" | "sky" | "indigo";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 border border-brand-200/60",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    red: "bg-rose-50 text-rose-700 border border-rose-200/60",
    amber: "bg-amber-50 text-amber-700 border border-amber-200/60",
    sky: "bg-sky-50 text-sky-700 border border-sky-200/60",
    slate: "bg-slate-100 text-slate-700 border border-slate-200/60",
  };
  return (
    <span className={clsx("pill font-medium transition-colors", toneClasses[tone] || toneClasses.brand, className)}>
      {children}
    </span>
  );
}

export function ImportancePill({ importance }: { importance: string }) {
  const tone =
    importance === "Critical"
      ? "red"
      : importance === "High"
      ? "amber"
      : importance === "Medium"
      ? "brand"
      : "slate";
  return <Pill tone={tone as any}>{importance}</Pill>;
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-2">
        <span className="text-xl">🔍</span>
      </div>
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 max-w-sm">{subtitle}</p>}
    </div>
  );
}

export function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="card flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {label}
    </div>
  );
}

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#059669" : score >= 50 ? "#6b3ff0" : "#d97706";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900">
          {Math.round(score)}
        </span>
        <span className="text-[10px] font-semibold text-slate-400 -mt-1">/ 100</span>
      </div>
    </div>
  );
}
