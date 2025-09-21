import { Review } from '@preset/domain';
import { Rating, ReviewTag } from '@preset/domain';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Note: Reviews table not implemented in database schema yet
// type ReviewRow = Database['public']['Tables']['reviews']['Row'];
// type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

// Define the repository interface since it's not in domain yet
export interface ReviewRepository {
  findById(id: string): Promise<Review | null>;
  findByGigId(gigId: string): Promise<Review[]>;
  findByReviewerId(reviewerId: string): Promise<Review[]>;
  findByRevieweeId(revieweeId: string): Promise<Review[]>;
  findMutualReview(gigId: string, user1: string, user2: string): Promise<Review[]>;
  save(review: Review): Promise<void>;
  delete(id: string): Promise<void>;
  getAverageRating(userId: string): Promise<number>;
  getReviewStats(userId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    topTags: ReviewTag[];
  }>;
}

export class SupabaseReviewRepository implements ReviewRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Review | null> {
    // Reviews table not implemented yet
    throw new Error('Reviews table not implemented in database schema');
  }

  async findByGigId(gigId: string): Promise<Review[]> {
    throw new Error('Reviews table not implemented in database schema');
  }

  async findByReviewerId(reviewerId: string): Promise<Review[]> {
    throw new Error('Reviews table not implemented in database schema');
  }

  async findByRevieweeId(revieweeId: string): Promise<Review[]> {
    throw new Error('Reviews table not implemented in database schema');
  }

  async findMutualReview(gigId: string, user1: string, user2: string): Promise<Review[]> {
    throw new Error('Reviews table not implemented in database schema');
  }

  async save(review: Review): Promise<void> {
    throw new Error('Reviews table not implemented in database schema');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Reviews table not implemented in database schema');
  }

  async getAverageRating(userId: string): Promise<number> {
    throw new Error('Reviews table not implemented in database schema');
  }

  async getReviewStats(userId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    topTags: ReviewTag[];
  }> {
    throw new Error('Reviews table not implemented in database schema');
  }
}