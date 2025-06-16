import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export const useAppStore = create(
  devtools(
    (set, get) => ({
      // UI State
      sidebarOpen: false,
      loading: false,
      error: null,
      
      // Selected neighborhoods for comparison
      selectedNeighborhoods: [],
      
      // Current search filters
      searchFilters: {
        borough: '',
        maxRent: null,
        minSafetyScore: null,
        familyFriendly: false,
        youngProfessionals: false,
        transitAccess: false,
        quiet: false,
        cultural: false
      },
      
      // Chat state
      chatMessages: [],
      chatSessionId: null,
      
      // Map state
      mapCenter: { lat: -33.9249, lng: 18.4241 }, // Cape Town default
      mapZoom: 11,
      
      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),
      
      // Neighborhood selection
      addSelectedNeighborhood: (neighborhood) => {
        const { selectedNeighborhoods } = get()
        if (selectedNeighborhoods.length >= 5) {
          set({ error: 'Maximum 5 neighborhoods can be selected for comparison' })
          return
        }
        if (!selectedNeighborhoods.find(n => n._id === neighborhood._id)) {
          set({ 
            selectedNeighborhoods: [...selectedNeighborhoods, neighborhood],
            error: null
          })
        }
      },
      
      removeSelectedNeighborhood: (neighborhoodId) => {
        const { selectedNeighborhoods } = get()
        set({
          selectedNeighborhoods: selectedNeighborhoods.filter(n => n._id !== neighborhoodId)
        })
      },
      
      clearSelectedNeighborhoods: () => set({ selectedNeighborhoods: [] }),
      
      // Search filters
      updateSearchFilters: (filters) => {
        const { searchFilters } = get()
        set({
          searchFilters: { ...searchFilters, ...filters }
        })
      },
      
      clearSearchFilters: () => set({
        searchFilters: {
          borough: '',
          maxRent: null,
          minSafetyScore: null,
          familyFriendly: false,
          youngProfessionals: false,
          transitAccess: false,
          quiet: false,
          cultural: false
        }
      }),
      
      // Chat
      addChatMessage: (message) => {
        const { chatMessages } = get()
        set({
          chatMessages: [...chatMessages, {
            ...message,
            id: Date.now(),
            timestamp: new Date()
          }]
        })
      },
      
      clearChatMessages: () => set({ chatMessages: [] }),
      
      setChatSessionId: (sessionId) => set({ chatSessionId: sessionId }),
      
      // Map
      setMapCenter: (center) => set({ mapCenter: center }),
      
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      
      // Utility actions
      reset: () => set({
        selectedNeighborhoods: [],
        searchFilters: {
          borough: '',
          maxRent: null,
          minSafetyScore: null,
          familyFriendly: false,
          youngProfessionals: false,
          transitAccess: false,
          quiet: false,
          cultural: false
        },
        chatMessages: [],
        chatSessionId: null,
        error: null
      })
    }),
    {
      name: 'city-insights-store',
      version: 2, // Increment to clear old cached data
      partialize: (state) => ({
        // Only persist certain parts of the state
        selectedNeighborhoods: state.selectedNeighborhoods,
        searchFilters: state.searchFilters,
        mapCenter: state.mapCenter,
        mapZoom: state.mapZoom
      })
    }
  )
)
