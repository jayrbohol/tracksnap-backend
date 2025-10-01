// This is a reference model (JSDoc) for parcels stored in the data layer.
/**
 * @typedef {Object} Parcel
 * @property {string} id
 * @property {{
 *   name:string,
 *   phone?:string,
 *   email?:string,
 *   // Optional geolocation of recipient destination (lat:-90..90, lng:-180..180)
 *   coordinates?: { lat:number, lng:number }
 * }} recipient
 * @property {Object} metadata
 * @property {{lat:number,lng:number}|undefined} sortationCenter - Optional originating facility coordinates
 * @property {{lat:number,lng:number}|undefined} deliveryHub - Optional last-mile hub coordinates
 * @property {{lat:number,lng:number}|undefined} pickupLocation - Optional initial pickup point coordinates
 * @property {{
 *   pickupToSortation?: { meters:number, km:number },
 *   sortationToHub?: { meters:number, km:number },
 *   hubToDestination?: { meters:number, km:number },
 *   sortationToDestination?: { meters:number, km:number },
 *   totalRoute?: { meters:number, km:number }
 * }|undefined} legs - Computed leg distances (set on first tracking event)
 * @property {Array<{ timestamp:string, actor?:string, changes:{ sortationCenter?: {from?:any,to?:any}, deliveryHub?: {from?:any,to?:any} } }>|undefined} hubAuditLog - History of hub coordinate changes
 * @property {string} status - pending|delivered|flagged
 * @property {Array<{timestamp:string, gps?:any, courierId?:string, photoURL?:string}>} handoffLog
 * @property {Array<{timestamp:string, coordinates:{lat:number,lng:number}}>} trackingLog
 * @property {{rating?:number, issue?:string, timestamp?:string}|null} feedback
 * @property {string} qr - QR code data URL
 */
