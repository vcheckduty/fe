'use client';

import { useEffect, useRef, useState } from 'react';
import config from '@/lib/config';

interface MapViewProps {
  userLocation?: { lat: number; lng: number };
  showGeofence?: boolean;
  className?: string;
}

export default function MapView({ userLocation, showGeofence = true, className = '' }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps API is available
    if (typeof window !== 'undefined' && (window as any).google) {
      initMap();
    } else {
      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      script.onerror = () => setMapError('Không thể tải bản đồ. Vui lòng kiểm tra API key.');
      document.head.appendChild(script);
    }
  }, [userLocation]);

  const initMap = () => {
    if (!mapRef.current || !(window as any).google) return;

    const google = (window as any).google;
    const center = { lat: config.office.latitude, lng: config.office.longitude };

    const map = new google.maps.Map(mapRef.current, {
      zoom: 17,
      center: center,
      mapTypeId: 'roadmap',
      disableDefaultUI: true, // Cleaner look
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f8fafc' }], // slate-50
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#ffedd5' }], // orange-100
        },
      ],
    });

    // Add HQ marker
    new google.maps.Marker({
      position: center,
      map: map,
      title: config.office.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#ea580c', // Orange-600
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
    });

    // Add geofence circle
    if (showGeofence) {
      new google.maps.Circle({
        strokeColor: '#ea580c', // Orange-600
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#ea580c', // Orange-600
        fillOpacity: 0.15,
        map: map,
        center: center,
        radius: config.office.radius,
      });
    }

    // Add user location marker if available
    if (userLocation) {
      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Vị trí của bạn',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981', // Emerald-500
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
      });
    }
  };

  if (mapError) {
    return (
      <div className={`bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 ${className}`}>
        <div className="text-center p-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-slate-900 font-medium">{mapError}</p>
          <p className="text-sm text-slate-500 mt-1">Vui lòng kiểm tra cấu hình Google Maps API</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={`rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`} />;
}
