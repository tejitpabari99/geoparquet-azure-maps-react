import React, { useEffect, useState, useRef } from 'react';
import { AzureMap, AzureMapsProvider, AuthenticationType } from 'react-azure-maps';
import * as atlas from 'azure-maps-control';
import { asyncBufferFromUrl } from 'hyparquet';
import { toGeoJson } from 'geoparquet';
import { compressors } from 'hyparquet-compressors'


const mapOptions = {
  authOptions: {
    authType: AuthenticationType.subscriptionKey,
    subscriptionKey: '***',
  },
};

function App() {
  const mapRef = useRef(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load GeoParquet and convert to GeoJSON
  useEffect(() => {
    const loadGeoParquet = async () => {
      // WKB - https://fabric0trial0storage.blob.core.windows.net/trialtiles/data-point-encoding_wkb.parquet
      // Native 1 - https://fabric0trial0storage.blob.core.windows.net/trialtiles/data-point-encoding_native.parquet
      // Native 2 (Bigger) - https://fabric0trial0storage.blob.core.windows.net/trialtiles/polys.parquet
      const file = await asyncBufferFromUrl({url: 'https://fabric0trial0storage.blob.core.windows.net/trialtiles/polys.parquet'});

      const geojson = await toGeoJson({ file, compressors }); 
      console.log('geoparquet', geojson);

      setGeojsonData(geojson);
    };

    loadGeoParquet();
  }, []);

  function afterLoad(map) {
    console.log('Map loaded');
    mapRef.current = map;
    setMapLoaded(true);
  }

  useEffect(() => {
    if (mapRef.current && geojsonData && mapLoaded) {
      const map = mapRef.current.map;

      const dataSource = new atlas.source.DataSource();
      map.sources.add(dataSource);
      dataSource.add(geojsonData);
      
      // Add polygon layer
      const polygonLayer = new atlas.layer.PolygonLayer(dataSource, null, {
        fillColor: 'rgba(255, 0, 0, 0.5)',
        fillOpacity: 0.7,
      });
      
      // Add line layer for polygon outlines
      const lineLayer = new atlas.layer.LineLayer(dataSource, null, {
        strokeColor: 'blue',
        strokeWidth: 1
      });
      
      // Add point layer if needed
      const pointLayer = new atlas.layer.SymbolLayer(dataSource, null, {
        iconOptions: {
          image: 'pin-round-darkblue',
          anchor: 'center',
          size: 0.8
        }
      });
      
      map.layers.add([polygonLayer, lineLayer, pointLayer]);
      console.log('Layers added');
    }
  }, [geojsonData, mapLoaded]);

  return (
    <AzureMapsProvider>
      <div style={{ height: '900px' }}>
        <AzureMap
          options={mapOptions}
          events={{
            ready: afterLoad,
          }}
        />
      </div>
    </AzureMapsProvider>
  );
}

export default App;
