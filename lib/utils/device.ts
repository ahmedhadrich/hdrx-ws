// Phones, tablets and anything touch-first get the bare screen: no MacBook, room or WebGL.
// Also inlined in the pre-paint script and themeColor in app/layout.tsx, and mirrored in globals.css.
export const MOBILE_QUERY = '(max-width: 767px), (pointer: coarse)';
