import type { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white border border-[#ead6d6] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#8b6f6f]">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-[#4a3535]">{value}</h3>
          {subtitle ? (
            <p className="mt-2 text-sm text-[#8b6f6f]">{subtitle}</p>
          ) : null}
        </div>

        {icon ? (
          <div className="rounded-2xl bg-[#f7e8e8] p-3 text-[#a26c73]">
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}