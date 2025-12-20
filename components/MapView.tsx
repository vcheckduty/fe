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
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
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
        scale: 10,
        fillColor: '#D32F2F',
        fillOpacity: 1,
        strokeColor: '#FFD700',
        strokeWeight: 3,
      },
    });

    // Add geofence circle
    if (showGeofence) {
      new google.maps.Circle({
        strokeColor: '#D32F2F',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#D32F2F',
        fillOpacity: 0.2,
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
          scale: 8,
          fillColor: '#4CAF50',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });
    }
  };

  if (mapError) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <p className="text-red-600 font-medium">{mapError}</p>
          <p className="text-sm text-gray-600 mt-2">Hiển thị bản đồ tĩnh</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={`rounded-lg shadow-inner ${className}`} />;
}
