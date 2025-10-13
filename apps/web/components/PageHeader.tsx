'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  stats?: Array<{ icon: LucideIcon; label: string }>;
  actions?: ReactNode;
  backgroundImage?: string | null;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  stats,
  actions,
  backgroundImage
}: PageHeaderProps) {
  return (
    <div className="relative mb-8 rounded-2xl overflow-hidden border border-border shadow-lg">
      {/* Background image or gradient */}
      {backgroundImage ? (
        <>
          <div className="absolute inset-0">
            <img
              src={backgroundImage}
              alt={`${title} background`}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </>
      )}

      {/* Content */}
      <div className="relative p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                {Icon && (
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                )}
                <div>
                  <h1 className={`text-5xl md:text-6xl font-bold mb-2 ${backgroundImage ? 'text-white' : 'text-foreground'}`}>
                    {title}
                  </h1>
                  {subtitle && (
                    <p className={`text-xl ${backgroundImage ? 'text-white/90' : 'text-muted-foreground'}`}>
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {stats && stats.length > 0 && (
                <div className={`flex items-center gap-6 mt-6 text-sm ${backgroundImage ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <stat.icon className="h-4 w-4" />
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center space-x-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
