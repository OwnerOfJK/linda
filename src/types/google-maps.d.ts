// declare namespace google {
//   namespace maps {
//     class Map {
//       constructor(mapDiv: Element, opts?: MapOptions);
//       setCenter(latLng: LatLng | LatLngLiteral): void;
//       setZoom(zoom: number): void;
//       setOptions(options: MapOptions): void;
//       panTo(latLng: LatLng | LatLngLiteral): void;
//       panBy(x: number, y: number): void;
//       fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
//       getBounds(): LatLngBounds;
//       getCenter(): LatLng;
//       getDiv(): Element;
//       getZoom(): number;
//       setMapTypeId(mapTypeId: string): void;
//       getMapTypeId(): string;
//     }

//     interface MapOptions {
//       center?: LatLng | LatLngLiteral;
//       zoom?: number;
//       minZoom?: number;
//       maxZoom?: number;
//       mapTypeId?: string;
//       mapTypeControl?: boolean;
//       mapTypeControlOptions?: any;
//       streetViewControl?: boolean;
//       fullscreenControl?: boolean;
//       zoomControl?: boolean;
//       zoomControlOptions?: any;
//       styles?: any[];
//       gestureHandling?: string;
//       clickableIcons?: boolean;
//       disableDefaultUI?: boolean;
//       draggable?: boolean;
//       fullscreenControlOptions?: any;
//       heading?: number;
//       keyboardShortcuts?: boolean;
//       panControl?: boolean;
//       panControlOptions?: any;
//       rotateControl?: boolean;
//       rotateControlOptions?: any;
//       scaleControl?: boolean;
//       scaleControlOptions?: any;
//       scrollwheel?: boolean;
//       streetView?: any;
//       streetViewControlOptions?: any;
//       tilt?: number;
//     }

//     class LatLng {
//       constructor(lat: number, lng: number, noWrap?: boolean);
//       lat(): number;
//       lng(): number;
//       toString(): string;
//       toUrlValue(precision?: number): string;
//       toJSON(): LatLngLiteral;
//       equals(other: LatLng): boolean;
//     }

//     interface LatLngLiteral {
//       lat: number;
//       lng: number;
//     }

//     class LatLngBounds {
//       constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
//       contains(latLng: LatLng | LatLngLiteral): boolean;
//       equals(other: LatLngBounds | LatLngBoundsLiteral): boolean;
//       extend(point: LatLng | LatLngLiteral): LatLngBounds;
//       getCenter(): LatLng;
//       getNorthEast(): LatLng;
//       getSouthWest(): LatLng;
//       intersects(other: LatLngBounds | LatLngBoundsLiteral): boolean;
//       isEmpty(): boolean;
//       toJSON(): LatLngBoundsLiteral;
//       toSpan(): LatLng;
//       toString(): string;
//       toUrlValue(precision?: number): string;
//       union(other: LatLngBounds | LatLngBoundsLiteral): LatLngBounds;
//     }

//     interface LatLngBoundsLiteral {
//       east: number;
//       north: number;
//       south: number;
//       west: number;
//     }

//     interface Padding {
//       top: number;
//       right: number;
//       bottom: number;
//       left: number;
//     }

//     namespace marker {
//       class AdvancedMarkerElement {
//         constructor(options?: AdvancedMarkerElementOptions);
//         position: LatLng | LatLngLiteral;
//         map: Map | null;
//         title: string | null;
//         content: Node | null;
//         addListener(eventName: string, handler: Function): any;
//       }

//       interface AdvancedMarkerElementOptions {
//         position?: LatLng | LatLngLiteral;
//         map?: Map | null;
//         title?: string;
//         content?: Node;
//       }
//     }
//   }
// } 