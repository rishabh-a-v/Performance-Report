// Single source of truth for page titles, consumed by TopBar (desktop) and
// MobileHeader (native app) so the two can never drift out of sync.
export const ROUTE_TITLES: Record<string, string> = {
  '/tasks': 'Tasks',
  '/job-directions': 'Job Directions',
  '/calendar': 'Calendar',
  '/reports': 'Reports',
  '/capacity': 'Capacity Planning',
  '/approval-center': 'Approvals',
  '/manage-employees': 'Employees',
  '/admin/org-chart': 'Org Chart',
  '/admin/role-permissions': 'Role Permissions',
  '/more': 'More',
}
