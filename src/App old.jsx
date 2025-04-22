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
  const dataSourceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [dataSourceCreated, setDataSourceCreated] = useState(false);

  // Load GeoParquet and convert to GeoJSON
  useEffect(() => {
      if (mapReady && !dataSourceRef.current) {
        dataSourceRef.current = new atlas.source.DataSource();

        const map = mapRef.current;
        map.sources.add(dataSourceRef.current);

        const polygonLayer = new atlas.layer.PolygonLayer(dataSourceRef.current, null, {fillColor: 'red'});
        map.layers.add(polygonLayer);
        setDataSourceCreated(true);
      }
  }, [mapReady, dataSourceCreated]);

  useEffect(() => {
    if (!dataSourceCreated) {
      return; // Wait until data source is created
    }
    const loadGeoParquet = async () => {
      const dataSource = dataSourceRef.current;
      const file = await asyncBufferFromUrl({url: 'https://fabric0trial0storage.blob.core.windows.net/trialtiles/polys.parquet', 
        // requestInit: {
        //   headers: {
        //     'Authorization': "Bearer ***"
        //   }
        // }
      });
      console.log(file);

      // const response = await fetch('https://fabric0trial0storage.blob.core.windows.net/trialtiles/data-point-encoding_wkb.parquet');
      // if (!response.ok) {
      //   throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      // }
      
      // // Get the file as ArrayBuffer directly
      // const arrayBuffer = await response.arrayBuffer();
      // console.log('Fetched array buffer type:', Object.prototype.toString.call(arrayBuffer));

      const geojson = await toGeoJson({ file, compressors });
      console.log('geoparquet', geojson);
      dataSource.add(geojson);
    };

    loadGeoParquet();
  }, [dataSourceCreated]);

  const handleMapReady = (map) => {
    console.log('Map is ready');
    mapRef.current = map;
    setMapReady(true);
  };

  return (
    <AzureMapsProvider>
      <div style={{ height: '900px' }}>
        <AzureMap
          options={mapOptions}
          onReady={handleMapReady}
        />
      </div>
    </AzureMapsProvider>
  );
}

export default App;
