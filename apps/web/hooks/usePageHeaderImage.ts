import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePageHeaderImage(category: string) {
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeaderImage = async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('platform_images')
          .select('image_url')
          .eq('category', category)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(1)
          .single();

        if (!error && data) {
          setHeaderImage(data.image_url);
        }
      } catch (error) {
        console.log(`No header image set for ${category}`);
      } finally {
        setLoading(false);
      }
    };

    fetchHeaderImage();
  }, [category]);

  return { headerImage, loading };
}
