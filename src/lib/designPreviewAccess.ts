export interface DesignPreviewAccessConditions {
  isDevelopment: boolean
  flagEnabled: boolean
  hostname: string
  backendConfigured: boolean
}

export function isDesignPreviewAccessAllowed({
  isDevelopment,
  flagEnabled,
  hostname,
  backendConfigured,
}: DesignPreviewAccessConditions) {
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1'
  return isDevelopment && flagEnabled && isLoopback && !backendConfigured
}
