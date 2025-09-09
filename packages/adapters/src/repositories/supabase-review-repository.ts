import { Review } from '@preset/domain/showcases/entities/Review';
import { Rating, ReviewTag } from '@preset/domain/showcases/value-objects/ReviewTag';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

type ReviewRow = Database['public']['Tables']['reviews']['Row'];
type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

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
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toDomain(data);
  }

  async findByGigId(gigId: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('gig_id', gigId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(row => this.toDomain(row));
  }

  async findByReviewerId(reviewerId: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('reviewer_user_id', reviewerId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(row => this.toDomain(row));
  }

  async findByRevieweeId(revieweeId: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_user_id', revieweeId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map(row => this.toDomain(row));
  }

  async findMutualReview(gigId: string, user1: string, user2: string): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('gig_id', gigId)
      .or(`and(reviewer_user_id.eq.${user1},reviewee_user_id.eq.${user2}),and(reviewer_user_id.eq.${user2},reviewee_user_id.eq.${user1})`);

    if (error || !data) {
      return [];
    }

    return data.map(row => this.toDomain(row));
  }

  async save(review: Review): Promise<void> {
    const data = this.toDatabase(review);

    const { error } = await this.supabase
      .from('reviews')
      .upsert(data, {
        onConflict: 'id'
      });

    if (error) {
      throw new Error(`Failed to save review: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  async getAverageRating(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_user_id', userId);

    if (error || !data || data.length === 0) {
      return 0;
    }

    const sum = data.reduce((acc, row) => acc + row.rating, 0);
    return sum / data.length;
  }

  async getReviewStats(userId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    topTags: ReviewTag[];
  }> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_user_id', userId);

    if (error || !data) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topTags: []
      };
    }

    // Calculate statistics
    const totalReviews = data.length;
    const averageRating = totalReviews > 0
      ? data.reduce((acc, row) => acc + row.rating, 0) / totalReviews
      : 0;

    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(row => {
      ratingDistribution[row.rating] = (ratingDistribution[row.rating] || 0) + 1;
    });

    // Count tags
    const tagCounts = new Map<string, number>();
    data.forEach(row => {
      if (row.tags && Array.isArray(row.tags)) {
        row.tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Get top tags
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag as ReviewTag);

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
      topTags
    };
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: ReviewRow): Review {
    return new Review({
      id: row.id,
      gigId: row.gig_id,
      reviewerId: row.reviewer_user_id,
      revieweeId: row.reviewee_user_id,
      rating: new Rating(row.rating),
      tags: (row.tags || []) as ReviewTag[],
      comment: row.comment || '',
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      helpfulCount: row.helpful_count || 0
    });
  }

  /**
   * Convert domain entity to database row
   */
  private toDatabase(review: Review): ReviewInsert {
    const json = review.toJSON();
    return {
      id: json.id,
      gig_id: json.gigId,
      reviewer_user_id: json.reviewerId,
      reviewee_user_id: json.revieweeId,
      rating: json.rating,
      tags: json.tags,
      comment: json.comment,
      created_at: json.createdAt,
      updated_at: json.updatedAt,
      helpful_count: json.helpfulCount
    };
  }
}