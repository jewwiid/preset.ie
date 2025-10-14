/**
 * Global Mention Registry Store
 * 
 * Zustand store for managing mentions across tabs with cross-tab sharing,
 * recent mentions, and entity management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MentionableEntity, MentionType } from '@/lib/utils/mention-types';

interface MentionRegistry {
  // Core state
  entities: Map<string, MentionableEntity>;
  recentMentions: MentionableEntity[];
  crossTabMentions: Map<string, MentionableEntity[]>; // Share across tabs
  userFavorites: Set<string>; // User's favorite entity IDs
  
  // Actions
  addEntity: (entity: MentionableEntity) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<MentionableEntity>) => void;
  getEntity: (id: string) => MentionableEntity | undefined;
  
  // Recent mentions management
  addToRecent: (entity: MentionableEntity) => void;
  clearRecent: () => void;
  getRecentMentions: (limit?: number) => MentionableEntity[];
  
  // Cross-tab sharing
  setCrossTabMentions: (fromTab: string, toTab: string, entities: MentionableEntity[]) => void;
  getCrossTabMentions: (fromTab: string, toTab: string) => MentionableEntity[];
  clearCrossTabMentions: (tab?: string) => void;
  
  // Favorites management
  toggleFavorite: (entityId: string) => void;
  getFavorites: () => MentionableEntity[];
  isFavorite: (entityId: string) => boolean;
  
  // Query methods
  getMentionsByType: (type: MentionType) => MentionableEntity[];
  getMentionsByCategory: (category: string) => MentionableEntity[];
  searchMentions: (query: string) => MentionableEntity[];
  
  // Bulk operations
  addEntities: (entities: MentionableEntity[]) => void;
  clearAll: () => void;
  
  // Statistics
  getStats: () => {
    totalEntities: number;
    recentCount: number;
    favoritesCount: number;
    crossTabCount: number;
    typeDistribution: Record<MentionType, number>;
  };
}

// Tab identifiers
export const TAB_IDS = {
  GENERATE: 'generate',
  VIDEO: 'video',
  EDIT: 'edit',
  STITCH: 'stitch',
  BATCH: 'batch'
} as const;

export type TabId = typeof TAB_IDS[keyof typeof TAB_IDS];

export const useMentionRegistry = create<MentionRegistry>()(
  persist(
    (set, get) => ({
      // Initial state
      entities: new Map(),
      recentMentions: [],
      crossTabMentions: new Map(),
      userFavorites: new Set(),

      // Core entity management
      addEntity: (entity: MentionableEntity) => {
        set((state) => {
          const newEntities = new Map(state.entities);
          newEntities.set(entity.id, entity);
          return { entities: newEntities };
        });
      },

      removeEntity: (id: string) => {
        set((state) => {
          const newEntities = new Map(state.entities);
          newEntities.delete(id);
          
          // Remove from recent mentions
          const newRecentMentions = state.recentMentions.filter(e => e.id !== id);
          
          // Remove from favorites
          const newFavorites = new Set(state.userFavorites);
          newFavorites.delete(id);
          
          return {
            entities: newEntities,
            recentMentions: newRecentMentions,
            userFavorites: newFavorites
          };
        });
      },

      updateEntity: (id: string, updates: Partial<MentionableEntity>) => {
        set((state) => {
          const entity = state.entities.get(id);
          if (!entity) return state;

          const updatedEntity = { ...entity, ...updates };
          const newEntities = new Map(state.entities);
          newEntities.set(id, updatedEntity);

          return { entities: newEntities };
        });
      },

      getEntity: (id: string) => {
        return get().entities.get(id);
      },

      // Recent mentions management
      addToRecent: (entity: MentionableEntity) => {
        set((state) => {
          // Remove if already exists to avoid duplicates
          const filteredRecent = state.recentMentions.filter(e => e.id !== entity.id);
          
          // Add to beginning and limit to 20 items
          const newRecentMentions = [entity, ...filteredRecent].slice(0, 20);
          
          return { recentMentions: newRecentMentions };
        });
      },

      clearRecent: () => {
        set({ recentMentions: [] });
      },

      getRecentMentions: (limit = 10) => {
        return get().recentMentions.slice(0, limit);
      },

      // Cross-tab sharing
      setCrossTabMentions: (fromTab: string, toTab: string, entities: MentionableEntity[]) => {
        set((state) => {
          const newCrossTabMentions = new Map(state.crossTabMentions);
          const key = `${fromTab}->${toTab}`;
          newCrossTabMentions.set(key, entities);
          
          return { crossTabMentions: newCrossTabMentions };
        });
      },

      getCrossTabMentions: (fromTab: string, toTab: string) => {
        const key = `${fromTab}->${toTab}`;
        return get().crossTabMentions.get(key) || [];
      },

      clearCrossTabMentions: (tab?: string) => {
        set((state) => {
          if (!tab) {
            return { crossTabMentions: new Map() };
          }

          const newCrossTabMentions = new Map(state.crossTabMentions);
          // Remove all entries that involve the specified tab
          for (const [key] of newCrossTabMentions) {
            if (key.includes(tab)) {
              newCrossTabMentions.delete(key);
            }
          }

          return { crossTabMentions: newCrossTabMentions };
        });
      },

      // Favorites management
      toggleFavorite: (entityId: string) => {
        set((state) => {
          const newFavorites = new Set(state.userFavorites);
          if (newFavorites.has(entityId)) {
            newFavorites.delete(entityId);
          } else {
            newFavorites.add(entityId);
          }
          
          return { userFavorites: newFavorites };
        });
      },

      getFavorites: () => {
        const { entities, userFavorites } = get();
        return Array.from(userFavorites)
          .map(id => entities.get(id))
          .filter(Boolean) as MentionableEntity[];
      },

      isFavorite: (entityId: string) => {
        return get().userFavorites.has(entityId);
      },

      // Query methods
      getMentionsByType: (type: MentionType) => {
        const { entities } = get();
        return Array.from(entities.values()).filter(entity => entity.type === type);
      },

      getMentionsByCategory: (category: string) => {
        const { entities } = get();
        return Array.from(entities.values()).filter(
          entity => entity.metadata?.category === category
        );
      },

      searchMentions: (query: string) => {
        const { entities } = get();
        const lowerQuery = query.toLowerCase();
        
        return Array.from(entities.values()).filter(entity => 
          entity.label.toLowerCase().includes(lowerQuery) ||
          entity.value.toLowerCase().includes(lowerQuery) ||
          entity.metadata?.description?.toLowerCase().includes(lowerQuery) ||
          entity.metadata?.synonyms?.some(syn => syn.toLowerCase().includes(lowerQuery))
        );
      },

      // Bulk operations
      addEntities: (entities: MentionableEntity[]) => {
        set((state) => {
          const newEntities = new Map(state.entities);
          entities.forEach(entity => {
            newEntities.set(entity.id, entity);
          });
          
          return { entities: newEntities };
        });
      },

      clearAll: () => {
        set({
          entities: new Map(),
          recentMentions: [],
          crossTabMentions: new Map(),
          userFavorites: new Set()
        });
      },

      // Statistics
      getStats: () => {
        const { entities, recentMentions, userFavorites, crossTabMentions } = get();
        
        const typeDistribution = {} as Record<MentionType, number>;
        entities.forEach(entity => {
          typeDistribution[entity.type] = (typeDistribution[entity.type] || 0) + 1;
        });

        return {
          totalEntities: entities.size,
          recentCount: recentMentions.length,
          favoritesCount: userFavorites.size,
          crossTabCount: crossTabMentions.size,
          typeDistribution
        };
      }
    }),
    {
      name: 'mention-registry',
      // Only persist certain parts of the state
      partialize: (state) => ({
        entities: Array.from(state.entities.entries()),
        recentMentions: state.recentMentions,
        userFavorites: Array.from(state.userFavorites)
      }),
      // Custom storage with serialization for Map and Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            entities: new Map(parsed.entities || []),
            crossTabMentions: new Map(parsed.crossTabMentions || []),
            userFavorites: new Set(parsed.userFavorites || [])
          };
        },
        setItem: (name, value) => {
          const serialized = {
            ...value,
            entities: Array.from((value as any).entities.entries()),
            crossTabMentions: Array.from((value as any).crossTabMentions.entries()),
            userFavorites: Array.from((value as any).userFavorites)
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);

// Utility hooks for common operations
export const useRecentMentions = (limit?: number) => {
  return useMentionRegistry(state => state.getRecentMentions(limit));
};

export const useFavoriteMentions = () => {
  return useMentionRegistry(state => state.getFavorites());
};

export const useMentionsByType = (type: MentionType) => {
  return useMentionRegistry(state => state.getMentionsByType(type));
};

export const useMentionsByCategory = (category: string) => {
  return useMentionRegistry(state => state.getMentionsByCategory(category));
};

export const useMentionStats = () => {
  return useMentionRegistry(state => state.getStats());
};

// Cross-tab sharing utilities
export const useCrossTabMentions = (fromTab: TabId, toTab: TabId) => {
  return useMentionRegistry(state => state.getCrossTabMentions(fromTab, toTab));
};

export const useSetCrossTabMentions = () => {
  return useMentionRegistry(state => state.setCrossTabMentions);
};

// Entity management utilities
export const useAddEntity = () => {
  return useMentionRegistry(state => state.addEntity);
};

export const useRemoveEntity = () => {
  return useMentionRegistry(state => state.removeEntity);
};

export const useToggleFavorite = () => {
  return useMentionRegistry(state => state.toggleFavorite);
};

export const useIsFavorite = () => {
  return useMentionRegistry(state => state.isFavorite);
};
