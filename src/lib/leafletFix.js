// src/lib/leafletFix.js
import L from 'leaflet';
import marker2x from 'leaflet/dist/images/layers-2x.png';
import marker1x from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';

// Prevent broken marker icons in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: shadow,
});

export default L;
