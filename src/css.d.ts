// Allow side-effect CSS imports such as `import '@payloadcms/next/css'`
declare module '*.css' {}

// Payload's CSS barrel export – no runtime value, import purely for side-effects
declare module '@payloadcms/next/css' {}
