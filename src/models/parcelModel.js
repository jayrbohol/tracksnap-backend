// This is a reference model (JSDoc) for parcels stored in the data layer.
/**
 * @typedef {Object} Parcel
 * @property {string} id
 * @property {{name:string, phone?:string, email?:string}} recipient
 * @property {Object} metadata
 * @property {string} status - pending|delivered|flagged
 * @property {Array<{timestamp:string, gps?:any, courierId?:string, photoURL?:string}>} handoffLog
 * @property {Array<{timestamp:string, coordinates:{lat:number,lng:number}}>} trackingLog
 * @property {{rating?:number, issue?:string, timestamp?:string}|null} feedback
 * @property {string} qr - QR code data URL
 */
