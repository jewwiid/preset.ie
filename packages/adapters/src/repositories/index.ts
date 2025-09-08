export * from './supabase-user-repository';
export * from './supabase-gig-repository';
export * from './supabase-application-repository';
export * from './supabase-showcase-repository';

// Repository factory for dependency injection
import { SupabaseClient } from '../clients/supabase.client';
import { SupabaseUserRepository } from './supabase-user-repository';
import { SupabaseGigRepository } from './supabase-gig-repository';
import { SupabaseApplicationRepository } from './supabase-application-repository';
import { SupabaseShowcaseRepository } from './supabase-showcase-repository';

export interface RepositoryContainer {
  userRepository: SupabaseUserRepository;
  gigRepository: SupabaseGigRepository;
  applicationRepository: SupabaseApplicationRepository;
  showcaseRepository: SupabaseShowcaseRepository;
}

export function createRepositoryContainer(client: SupabaseClient): RepositoryContainer {
  return {
    userRepository: new SupabaseUserRepository(client),
    gigRepository: new SupabaseGigRepository(client),
    applicationRepository: new SupabaseApplicationRepository(client),
    showcaseRepository: new SupabaseShowcaseRepository(client),
  };
}