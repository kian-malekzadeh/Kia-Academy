/** Build the canonical entitlement key stored in LearnerState. */
export function entitlementKey(resourceType: string, resourceId: string): string {
  return `${resourceType}:${resourceId}`;
}

export function hasRoadmapEntitlement(entitlements: string[], roadmapId?: string | null): boolean {
  if (roadmapId) {
    return entitlements.includes(entitlementKey('roadmap', roadmapId));
  }
  return entitlements.some((entry) => entry.startsWith('roadmap:'));
}

export function hasCourseEntitlement(entitlements: string[], courseSlug: string): boolean {
  return entitlements.includes(entitlementKey('course', courseSlug));
}
