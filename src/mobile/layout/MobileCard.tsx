import React from 'react';

interface MobileCardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

const cardBase = 'bg-gray-800 rounded-2xl shadow-lg border border-gray-800/60';
const paddingVariants = {
  true: 'p-4 md:p-5',
  false: 'p-0',
};

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  padded = true,
}) => {
  return (
    <section className={`${cardBase} ${paddingVariants[padded ? 'true' : 'false']} ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="flex items-center justify-between gap-3 mb-3">
          <div>
            {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 text-gray-300">{actions}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
};
