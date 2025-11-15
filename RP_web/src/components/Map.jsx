import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { config } from '../config'

export default function Map({
  pickupLocation,
  destinationLocation,
  currentLocation,
  onRouteReady,
  onDistanceUpdate,
  onArrival,
  pickupRadius = 50,
  destinationRadius = 50,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsServiceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const markersRef = useRef([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!config.maps.apiKey) {
      setError('Google Maps API key not configured')
      return
    }

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: config.maps.apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'],
        })

        await loader.load()

        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          ...config.maps.options,
          center: currentLocation
            ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
            : pickupLocation
            ? { lat: pickupLocation.latitude, lng: pickupLocation.longitude }
            : { lat: 23.8103, lng: 90.4125 }, // Default: Dhaka
        })

        mapInstanceRef.current = map

        // Initialize directions service
        directionsServiceRef.current = new google.maps.DirectionsService()
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#0ea5e9',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        })

        setIsLoaded(true)

        // Load route if locations available
        if (pickupLocation && destinationLocation) {
          calculateRoute()
        }
      } catch (err) {
        console.error('Map initialization error:', err)
        setError('Failed to load map')
      }
    }

    initMap()

    return () => {
      // Cleanup
      if (markersRef.current) {
        markersRef.current.forEach((marker) => marker.setMap(null))
      }
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !pickupLocation || !destinationLocation) return

    calculateRoute()
  }, [pickupLocation, destinationLocation, currentLocation, isLoaded])

  useEffect(() => {
    if (!isLoaded || !currentLocation) return

    updateCurrentLocationMarker()
    checkArrival()
  }, [currentLocation, isLoaded])

  const calculateRoute = () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return
    if (!pickupLocation || !destinationLocation) return

    const origin = currentLocation
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : { lat: pickupLocation.latitude, lng: pickupLocation.longitude }

    const destination = {
      lat: destinationLocation.latitude,
      lng: destinationLocation.longitude,
    }

    const waypoints = currentLocation && currentLocation.latitude !== pickupLocation.latitude
      ? [{ location: { lat: pickupLocation.latitude, lng: pickupLocation.longitude }, stopover: true }]
      : []

    directionsServiceRef.current.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === 'OK' && directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result)

          // Calculate distance and duration
          const route = result.routes[0]
          let totalDistance = 0
          let totalDuration = 0

          route.legs.forEach((leg) => {
            totalDistance += leg.distance.value
            totalDuration += leg.duration.value
          })

          if (onRouteReady) {
            onRouteReady({
              distance: totalDistance,
              duration: totalDuration,
            })
          }

          if (onDistanceUpdate) {
            onDistanceUpdate(totalDistance / 1000) // Convert to km
          }
        } else {
          console.error('Directions request failed:', status)
        }
      }
    )

    // Add markers
    addMarkers()
  }

  const addMarkers = () => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    // Pickup marker
    if (pickupLocation) {
      const pickupMarker = new google.maps.Marker({
        position: { lat: pickupLocation.latitude, lng: pickupLocation.longitude },
        map: mapInstanceRef.current,
        title: 'Pickup Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: {
          text: 'P',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      })
      markersRef.current.push(pickupMarker)

      // Pickup radius circle
      const pickupCircle = new google.maps.Circle({
        center: { lat: pickupLocation.latitude, lng: pickupLocation.longitude },
        radius: pickupRadius,
        map: mapInstanceRef.current,
        fillColor: '#22c55e',
        fillOpacity: 0.2,
        strokeColor: '#22c55e',
        strokeOpacity: 0.5,
        strokeWeight: 2,
      })
    }

    // Destination marker
    if (destinationLocation) {
      const destMarker = new google.maps.Marker({
        position: { lat: destinationLocation.latitude, lng: destinationLocation.longitude },
        map: mapInstanceRef.current,
        title: 'Destination',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: {
          text: 'D',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      })
      markersRef.current.push(destMarker)

      // Destination radius circle
      const destCircle = new google.maps.Circle({
        center: { lat: destinationLocation.latitude, lng: destinationLocation.longitude },
        radius: destinationRadius,
        map: mapInstanceRef.current,
        fillColor: '#ef4444',
        fillOpacity: 0.2,
        strokeColor: '#ef4444',
        strokeOpacity: 0.5,
        strokeWeight: 2,
      })
    }
  }

  const updateCurrentLocationMarker = () => {
    if (!mapInstanceRef.current || !currentLocation) return

    // Remove existing current location marker
    const existingMarker = markersRef.current.find((m) => m.getTitle() === 'Current Location')
    if (existingMarker) {
      existingMarker.setMap(null)
      const index = markersRef.current.indexOf(existingMarker)
      markersRef.current.splice(index, 1)
    }

    // Add current location marker
    const currentMarker = new google.maps.Marker({
      position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
      map: mapInstanceRef.current,
      title: 'Current Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#0ea5e9',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      label: {
        text: '📍',
        fontSize: '16px',
      },
    })
    markersRef.current.push(currentMarker)

    // Center map on current location
    mapInstanceRef.current.setCenter({
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
    })
  }

  const checkArrival = () => {
    if (!currentLocation || !onArrival) return

    // Check pickup arrival
    if (pickupLocation) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        pickupLocation.latitude,
        pickupLocation.longitude
      )
      if (distance <= pickupRadius) {
        onArrival('pickup', distance)
      }
    }

    // Check destination arrival
    if (destinationLocation) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destinationLocation.latitude,
        destinationLocation.longitude
      )
      if (distance <= destinationRadius) {
        onArrival('destination', distance)
      }
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600">
        <div className="text-center">
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-2">Please configure Google Maps API key</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="spinner mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

