import { computed } from 'vue';
import { useSingleWorkspace } from '../queries/useWorkspace';
import { useWorkspaceStore } from '../stores/workspace';
import { useWorkspaceId } from './useQueryParams';

/**
 * Composable for checking workspace permissions
 * Based on the user_access_role from the workspace API response
 */
export function usePermissions() {
  const workspaceStore = useWorkspaceStore();
  const { workspaceId } = useWorkspaceId();
  // useSingleWorkspace - Vue Query will handle reactivity through the query key
  // Even though the type says string | number, Vue Query can track computed values
  const { data: workspaceData } = useSingleWorkspace(workspaceId as any);

  // Get workspace data from either the query or store
  // The API returns { status, message, data: { ... } }
  // But defaultExtractor extracts res.data?.data ?? res.data
  // So workspaceData.value should be the workspace object directly
  const workspace = computed(() => {
    // Try multiple paths to find workspace data
    const fromQuery = workspaceData.value;
    const fromStore = workspaceStore.workspace;
    
    // If query data exists, use it (it's the most up-to-date)
    if (fromQuery) {
      return fromQuery;
    }
    
    // Fallback to store
    return fromStore;
  });

  // Get user access role data
  const userAccessRole = computed(() => {
    const ws = workspace.value;
    if (!ws) {
      return null;
    }
    
    // The user_access_role should be at the root of the workspace object
    // Check multiple possible paths in case the structure varies
    return ws.user_access_role || ws.data?.user_access_role || null;
  });

  // Check if user is admin (has all access)
  const isAdmin = computed(() => {
    const uar = userAccessRole.value;
    if (!uar) {
      // If no permission data available yet, default to true to prevent UI breaking
      // This will be corrected once data loads
      return true;
    }
    // Check if is_admin is true
    const accessRole = uar.access_role;
    if (!accessRole) {
      return false;
    }
    const isAdminValue = accessRole.is_admin;
    // Check for boolean true, string 'true', or number 1
    return isAdminValue === true || isAdminValue === 'true' || isAdminValue === 1;
  });

  // Get permission slugs array
  const permissionSlugs = computed(() => {
    const uar = userAccessRole.value;
    if (!uar) return [];
    return uar.permission_slugs || [];
  });

  // Check if user has a specific permission
  const hasPermission = (permissionSlug: string): boolean => {
    // If admin, always return true
    if (isAdmin.value) return true;
    
    // If no permission data available yet, default to true to prevent UI breaking
    const uar = userAccessRole.value;
    if (!uar) return true;
    
    return permissionSlugs.value.includes(permissionSlug);
  };

  // Helper functions for common permissions
  const canCreateModule = computed(() => hasPermission('workspace.module.create'));
  const canViewModule = computed(() => hasPermission('workspace.module.view_all'));
  const canEditModule = computed(() => hasPermission('workspace.module.update'));

  const canCreateLane = computed(() => hasPermission('workspace.lane.create'));
  const canViewLane = computed(() => hasPermission('workspace.lane.view_all'));
  const canEditLane = computed(() => hasPermission('workspace.lane.update'));

  const canCreateSheet = computed(() => hasPermission('workspace.sheet.create'));
  const canViewSheet = computed(() => hasPermission('workspace.sheet.view_all'));
  const canEditSheet = computed(() => hasPermission('workspace.sheet.update'));

  const canCreateCard = computed(() => hasPermission('workspace.card.create'));
  const canViewCard = computed(() => hasPermission('workspace.card.view_all'));
  const canEditCard = computed(() => hasPermission('workspace.card.update'));
  const canAssignCard = computed(() => hasPermission('workspace.card.assign'));

  const canCreateVariable = computed(() => hasPermission('workspace.variable.create'));
  const canViewVariable = computed(() => hasPermission('workspace.variable.view_all'));
  const canEditVariable = computed(() => hasPermission('workspace.variable.update'));

  const canCreateComment = computed(() => hasPermission('workspace.comment.create'));
  const canViewComment = computed(() => hasPermission('workspace.comment.view_all'));
  const canEditComment = computed(() => hasPermission('workspace.comment.update'));

  const canViewAttachment = computed(() => hasPermission('workspace.attachment.view_all'));
  const canUploadAttachment = computed(() => hasPermission('workspace.attachment.create'));

  const canInviteUser = computed(() => hasPermission('workspace.user.invite'));
  const canViewUser = computed(() => hasPermission('workspace.user.view_all'));
  const canEditUser = computed(() => hasPermission('workspace.user.update'));

  return {
    isAdmin,
    hasPermission,
    canCreateModule,
    canViewModule,
    canEditModule,
    canCreateLane,
    canViewLane,
    canEditLane,
    canCreateSheet,
    canViewSheet,
    canEditSheet,
    canCreateCard,
    canViewCard,
    canEditCard,
    canAssignCard,
    canCreateVariable,
    canViewVariable,
    canEditVariable,
    canCreateComment,
    canViewComment,
    canEditComment,
    canViewAttachment,
    canUploadAttachment,
    canInviteUser,
    canViewUser,
    canEditUser,
  };
}

