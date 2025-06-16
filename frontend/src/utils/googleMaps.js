// Google Maps API Dynamic Loader
let isLoaded = false
let loadPromise = null

export const loadGoogleMapsAPI = () => {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise
  }

  // Return resolved promise if already loaded
  if (isLoaded && window.google?.maps?.importLibrary) {
    return Promise.resolve()
  }

  // Create the loading promise
  loadPromise = new Promise((resolve, reject) => {
    try {
      // Get API key from environment variables
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
      if (!apiKey || apiKey === 'your-google-maps-api-key') {
        reject(new Error('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.'))
        return
      }

      // Google Maps Dynamic Library Import Bootstrap
      const g = {
        key: apiKey,
        v: "weekly",
        libraries: ["maps", "marker", "places"]
      }

      // Bootstrap loader code (minified version from Google)
      ;(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})(g)

      // Wait for the API to be available
      const checkLoaded = () => {
        if (window.google?.maps?.importLibrary) {
          isLoaded = true
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }

      checkLoaded()

    } catch (error) {
      reject(error)
    }
  })

  return loadPromise
}

// Helper function to import specific libraries
export const importMapsLibrary = async (library) => {
  await loadGoogleMapsAPI()
  return await google.maps.importLibrary(library)
}

// Preload common libraries
export const preloadMapsLibraries = async () => {
  await loadGoogleMapsAPI()
  
  // Preload commonly used libraries
  const libraries = ['maps', 'marker', 'places']
  const promises = libraries.map(lib => google.maps.importLibrary(lib))
  
  return Promise.all(promises)
}
