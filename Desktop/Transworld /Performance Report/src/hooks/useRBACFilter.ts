import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { usePermissionStore } from '@/store/permissionStore'
import type { Profile } from '@/types/database'

function getReportingChain(managerId: string, profiles: Profile[]): Set<string> {
  const chain = new Set<string>()
  function traverse(id: string) {
    for (const p of profiles) {
      if (p.manager_id === id && !chain.has(p.id)) {
        chain.add(p.id)
        traverse(p.id)
      }
    }
  }
  traverse(managerId)
  return chain
}

export function useRBACFilter() {
  const { user } = useAuth()
  const profiles = useProfileStore((s) => s.profiles)
  const departments = useProfileStore((s) => s.departments)
  const permissions = usePermissionStore((s) => s.permissions)

  // The set of profiles this user is allowed to see in team views
  const allowedProfiles = useMemo((): Profile[] => {
    if (!user || !permissions) return []

    // MD / EA / HR — company-wide
    if (permissions.can_view_all_branches) return profiles

    // Manager — recursive reporting chain, same branch
    if (permissions.must_be_in_reporting_chain) {
      const chain = getReportingChain(user.id, profiles)
      return profiles.filter((p) => chain.has(p.id) && p.branch === user.branch)
    }

    // Director — full branch visibility
    if (permissions.can_view_all_departments) {
      return profiles.filter((p) => p.branch === user.branch)
    }

    // Executive — only themselves (team tab will be empty)
    return profiles.filter((p) => p.id === user.id)
  }, [user, profiles, permissions])

  const allowedIds = useMemo(
    () => new Set(allowedProfiles.map((p) => p.id)),
    [allowedProfiles]
  )

  const branches = useProfileStore((s) => s.branches)
  const allBranchCodes = branches.map((b) => b.code)

  // For roles that see all branches show the full master list; otherwise derive from allowed set
  const availableBranches = useMemo(() => {
    if (permissions?.can_view_all_branches) return allBranchCodes.length > 0 ? allBranchCodes : [...new Set(profiles.map((p) => p.branch).filter(Boolean) as string[])].sort()
    return [...new Set(allowedProfiles.map((p) => p.branch).filter(Boolean) as string[])].sort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedProfiles, permissions, allBranchCodes])

  // Departments present in the allowed set (for dept filter dropdown)
  const availableDepartments = useMemo(() => {
    const deptIds = new Set(allowedProfiles.map((p) => p.department_id).filter(Boolean))
    return departments.filter((d) => deptIds.has(d.id))
  }, [allowedProfiles, departments])

  return {
    allowedProfiles,
    allowedIds,
    availableBranches,
    availableDepartments,
    showBranchFilter: permissions?.can_filter_branch ?? false,
    showDeptFilter: permissions?.can_filter_department ?? false,
  }
}
