import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Favorites store for neighborhoods and rental properties
const useFavoritesStore = create(
  persist(
    (set, get) => ({
      // State
      favoriteNeighborhoods: new Set(),
      favoriteRentals: new Set(),
      
      // Actions for neighborhoods
      addNeighborhoodToFavorites: (neighborhoodId) => {
        const favorites = new Set(get().favoriteNeighborhoods)
        favorites.add(neighborhoodId)
        set({ favoriteNeighborhoods: favorites })
      },
      
      removeNeighborhoodFromFavorites: (neighborhoodId) => {
        const favorites = new Set(get().favoriteNeighborhoods)
        favorites.delete(neighborhoodId)
        set({ favoriteNeighborhoods: favorites })
      },
      
      toggleNeighborhoodFavorite: (neighborhoodId) => {
        const favorites = new Set(get().favoriteNeighborhoods)
        if (favorites.has(neighborhoodId)) {
          favorites.delete(neighborhoodId)
        } else {
          favorites.add(neighborhoodId)
        }
        set({ favoriteNeighborhoods: favorites })
      },
      
      isNeighborhoodFavorited: (neighborhoodId) => {
        return get().favoriteNeighborhoods.has(neighborhoodId)
      },
      
      // Actions for rental properties
      addRentalToFavorites: (rentalId) => {
        const favorites = new Set(get().favoriteRentals)
        favorites.add(rentalId)
        set({ favoriteRentals: favorites })
      },
      
      removeRentalFromFavorites: (rentalId) => {
        const favorites = new Set(get().favoriteRentals)
        favorites.delete(rentalId)
        set({ favoriteRentals: favorites })
      },
      
      toggleRentalFavorite: (rentalId) => {
        const favorites = new Set(get().favoriteRentals)
        if (favorites.has(rentalId)) {
          favorites.delete(rentalId)
        } else {
          favorites.add(rentalId)
        }
        set({ favoriteRentals: favorites })
      },
      
      isRentalFavorited: (rentalId) => {
        return get().favoriteRentals.has(rentalId)
      },
      
      // Utility actions
      clearAllFavorites: () => {
        set({ 
          favoriteNeighborhoods: new Set(),
          favoriteRentals: new Set()
        })
      },
      
      getFavoriteNeighborhoodsArray: () => {
        return Array.from(get().favoriteNeighborhoods)
      },
      
      getFavoriteRentalsArray: () => {
        return Array.from(get().favoriteRentals)
      },
      
      getFavoritesCount: () => {
        return {
          neighborhoods: get().favoriteNeighborhoods.size,
          rentals: get().favoriteRentals.size,
          total: get().favoriteNeighborhoods.size + get().favoriteRentals.size
        }
      }
    }),
    {
      name: 'cape-town-insights-favorites', // localStorage key
      // Custom serialization to handle Sets
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          favoriteNeighborhoods: Array.from(state.favoriteNeighborhoods),
          favoriteRentals: Array.from(state.favoriteRentals)
        })
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        return {
          ...parsed,
          favoriteNeighborhoods: new Set(parsed.favoriteNeighborhoods || []),
          favoriteRentals: new Set(parsed.favoriteRentals || [])
        }
      }
    }
  )
)

export default useFavoritesStore
