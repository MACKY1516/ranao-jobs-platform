"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet icon issues
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/images/marker-icon.png",
    iconUrl: "/images/marker-icon.png",
    shadowUrl: "/images/marker-shadow.png",
  })
}

interface JobMapComponentProps {
  jobs: any[]
  onMarkerClick: (job: any) => void
}

export function JobMapComponent({ jobs, onMarkerClick }: JobMapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      fixLeafletIcon()

      // Initialize map if it doesn't exist
      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Center on Philippines
        const philippinesCenter: [number, number] = [12.8797, 121.774]

        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: philippinesCenter,
          zoom: 6,
          minZoom: 5,
          maxZoom: 18,
          maxBounds: L.latLngBounds(
            L.latLng(4.2158, 114.0952), // Southwest corner of bounds (approx)
            L.latLng(21.3217, 126.6043), // Northeast corner of bounds (approx)
          ),
          maxBoundsViscosity: 1.0, // Prevents dragging outside bounds
        })

        // Add OpenStreetMap tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstanceRef.current)

        // Add Philippines outline (simplified)
        fetch("/philippines-outline.geojson")
          .then((response) => response.json())
          .then((data) => {
            L.geoJSON(data, {
              style: {
                color: "#FFD700",
                weight: 2,
                opacity: 0.6,
                fillColor: "#FFD700",
                fillOpacity: 0.1,
              },
            }).addTo(mapInstanceRef.current!)
          })
          .catch((err) => console.error("Error loading Philippines outline:", err))

        setIsMapReady(true)
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Add markers when map is ready and jobs are available
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current && jobs.length > 0) {
      // Clear existing markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          marker.remove()
        })
        markersRef.current = []
      }

      // Create custom icon for job markers
      const jobIcon = L.icon({
        iconUrl: "/images/job-marker.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      })

      // Add job markers
      jobs.forEach((job) => {
        if (job.coordinates && Array.isArray(job.coordinates) && job.coordinates.length === 2) {
          const marker = L.marker(job.coordinates as [number, number], { icon: jobIcon }).addTo(mapInstanceRef.current!)

          // Create popup content
          const popupContent = `
            <div class="text-center p-2">
              <strong class="text-base">${job.title}</strong><br>
              <span class="text-sm text-gray-600">${job.company}</span><br>
              <span class="text-xs text-gray-500">${job.category}</span>
            </div>
          `

          // Create tooltip for hover
          const tooltip = L.tooltip({
            direction: "top",
            permanent: false,
            opacity: 0.9,
            className: "job-tooltip",
          }).setContent(`
            <div class="font-semibold">${job.title}</div>
            <div>${job.company}</div>
            <div class="text-xs">${job.category}</div>
          `)

          // Add hover functionality
          marker.bindTooltip(tooltip)

          // Add click functionality
          marker.on("click", () => {
            onMarkerClick(job)
          })

          markersRef.current.push(marker)
        }
      })

      // Fit bounds to markers if we have any
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current)
        mapInstanceRef.current.fitBounds(group.getBounds(), {
          padding: [50, 50],
          maxZoom: 12,
        })
      }

      // Add custom CSS for tooltips
      if (!document.getElementById("job-map-styles")) {
        const styleEl = document.createElement("style")
        styleEl.id = "job-map-styles"
        styleEl.innerHTML = `
          .job-tooltip {
            background-color: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 5px 8px;
            font-size: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .job-tooltip .leaflet-tooltip-content {
            white-space: nowrap;
          }
        `
        document.head.appendChild(styleEl)
      }
    }
  }, [isMapReady, jobs, onMarkerClick])

  return <div ref={mapContainerRef} className="w-full h-full z-10 rounded-lg overflow-hidden" />
}
