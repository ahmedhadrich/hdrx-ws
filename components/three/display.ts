// The live HTML screen is laid out at the 14" MacBook Pro's native "looks like" resolution
// and warped onto the 3D display. Kept apart from MacbookModel so the page can read it
// without pulling three/drei into the server-rendered bundle.
export const DISPLAY_PX = { width: 1512, height: 982 };
