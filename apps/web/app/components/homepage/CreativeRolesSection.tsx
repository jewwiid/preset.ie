'use client'

import Link from 'next/link';
import Image from 'next/image';
import { RoleCard } from '@/lib/utils/role-slug-mapper';

interface CreativeRolesSectionProps {
  randomizedRoles: RoleCard[];
  coverImage?: {
    image_url: string;
    alt_text?: string;
  } | null;
  getRoleImage: (slug: string) => { image_url: string; alt_text?: string } | undefined;
}

export default function CreativeRolesSection({
  randomizedRoles,
  coverImage,
  getRoleImage
}: CreativeRolesSectionProps) {
  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Cover Image */}
        <div className="mb-16">
          {coverImage ? (
            <div className="relative h-[300px] rounded-2xl overflow-hidden mb-8">
              <Image
                src={coverImage.image_url}
                alt={coverImage.alt_text || 'Creative roles'}
                fill
                className="object-cover"
              />
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40"></div>
              {/* Title overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-5xl font-bold text-white mb-4">CREATIVE ROLES</h2>
                <p className="text-xl text-white/90 max-w-2xl">
                  Explore our community by creative profession and find the perfect talent for your project
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-foreground mb-4">CREATIVE ROLES</h2>
              <p className="text-xl text-muted-foreground">
                Explore our community by creative profession and find the perfect talent for your project
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {randomizedRoles.map((role) => {
              // Get admin-uploaded image, fallback to role image, then to placeholder
              const roleImage = getRoleImage(role.slug);
              const imageUrl = roleImage?.image_url || role.imageUrl || '/placeholder-role.jpg';

              // Skip roles without images for now (will be added as admins upload them)
              if (!role.imageUrl && !roleImage) return null;

              return (
                <Link key={role.slug} href={`/${role.slug}`} className="group cursor-pointer block">
                  {/* Role Image */}
                  <div className="relative aspect-[4/5] mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={roleImage?.alt_text || `${role.name} professionals`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      quality={85}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
                    />
                    {/* Overlay gradient for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Role Info */}
                  <div className="text-center">
                    <h3 className="text-foreground font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {role.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {role.description}
                    </p>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </section>
  );
}
