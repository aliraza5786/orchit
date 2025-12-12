import { computed } from "vue";
import { useSingleWorkspace } from "../queries/useWorkspace";
import { useWorkspaceStore } from "../stores/workspace";
import { useWorkspaceId } from "./useQueryParams";

/**
 * Fully fixed & optimized permission composable
 */
export function usePermissions() {
  const workspaceStore = useWorkspaceStore();
  const { workspaceId } = useWorkspaceId();

  // Load workspace via Vue Query (reactive)
  const { data: workspaceData } = useSingleWorkspace(workspaceId as any);

  //  Get workspace (query → store fallback)
  const workspace = computed(() => {
    return workspaceData.value || workspaceStore.workspace || null;
  }); 
  console.log( workspace.value, "thessssssssssssss")


  //  Extract user_access_role
  const userAccessRole = computed(() => {
    const ws = workspace.value;
    if (!ws) return null;
    return ws.user_access_role || ws.data?.user_access_role || null;
  });

  //  Admin check
  const isAdmin = computed(() => {
    const role = userAccessRole.value;
    if (!role) return false;

    // Check for is_owner or is_admin (handle various truthy formats)
    const admin = role.is_admin ?? role.access_role?.is_admin;
    return role.is_owner === true || admin === true || admin === "true" || admin === 1;
  });

  //  Permissions array from backend ({ slug, enabled })
  const permissionsList = computed(() => {
    const role = userAccessRole.value; 
    if (!role) return [];
    return role.permissions || role.access_role?.permissions || [];
  });

  //  Main Permission Checker
  const hasPermission = (slug: string): boolean => {
    const list = permissionsList.value;
    console.log(list, ",,,,,,,,,,,,,,,")
    if (isAdmin.value) return true; 
    if (!list || !list.length) return false;

    const match = list.find(
      (p: { slug: string; enabled: boolean | string | number }) => p.slug === slug
    );

    return !!match && (match.enabled === true || match.enabled === "true" || match.enabled === 1);
  };

  // ---- Lane Permissions ----
  const canCreateLane = computed(() => hasPermission("workspace.lane.create"));
  const canViewLane = computed(() => hasPermission("workspace.lane.view_all"));
  const canEditLane = computed(() => hasPermission("workspace.lane.update"));
  const canDeleteLane = computed(() => hasPermission("workspace.lane.delete"));

  // ---- Sheet Permissions ----
  const canCreateSheet = computed(() =>
    hasPermission("workspace.sheet.create")
  );
  const canViewSheet = computed(() =>
    hasPermission("workspace.sheet.view_all")
  );
  const canEditSheet = computed(() => hasPermission("workspace.sheet.update"));
  const canDeleteSheet = computed(() =>
    hasPermission("workspace.sheet.delete")
  );
  // ---- Card Permissions ----
  const canCreateCard = computed(() => hasPermission("workspace.card.create"));
  const canViewCard = computed(() => hasPermission("workspace.card.view_all"));
  const canEditCard = computed(() => hasPermission("workspace.card.update"));
  const canAssignCard = computed(() => hasPermission("workspace.card.assign"));
  const canDeleteCard = computed(() => hasPermission("workspace.card.delete"));

  // ---- Variable Permissions ----
  const canCreateVariable = computed(() =>
    hasPermission("workspace.variable.create")
  );
  const canViewVariable = computed(() =>
    hasPermission("workspace.variable.view_all")
  );
  const canEditVariable = computed(() =>
    hasPermission("workspace.variable.update")
  );
  const canDeleteVariable = computed(() =>
    hasPermission("workspace.variable.delete")
  );

  // ---- Comment Permissions ----
  const canCreateComment = computed(() =>
    hasPermission("workspace.comment.create")
  );
  const canViewComment = computed(() =>
    hasPermission("workspace.comment.view_all")
  );
  const canEditComment = computed(() =>
    hasPermission("workspace.comment.update")
  );
  const canDeleteComment = computed(() =>
    hasPermission("workspace.delete.delete")
  );

  // ---- Attachment Permissions ----
  const canViewAttachment = computed(() =>
    hasPermission("workspace.attachment.view_all")
  );
  const canUploadAttachment = computed(() =>
    hasPermission("workspace.attachment.create")
  );

  // ---- User / Members ----
  const canInviteUser = computed(() => hasPermission("workspace.user.invite"));
  const canViewUser = computed(() => hasPermission("workspace.user.view_all"));
  const canEditUser = computed(() => hasPermission("workspace.user.update"));
  const canDeleteUser = computed(() => hasPermission("workspace.user.delete"));
  // ---- Module Permissions ----
  const canCreateModule = computed(() =>
    hasPermission("workspace.module.create")
  );
  const canViewModule = computed(() =>
    hasPermission("workspace.module.view_all")
  );
  const canEditModule = computed(() =>
    hasPermission("workspace.module.update")
  );


  // ---- Dynamic Module Permissions ----
  const canAccessModule = (
    moduleId: string,
    action: "create" | "view_all" | "update" | "delete"
  ) => {
    // If no module ID provided, check base module permissions? 
    // Or strictly check specific module permission.
    // Based on user request, they want to handle "View ABC Module", so specific.
    return hasPermission(`workspace.module.${action}.${moduleId}`) && hasPermission(`workspace.module.${action}`);
  };

  return {
    // Core
    isAdmin,
    hasPermission,

    // Workspace permissions
    canCreateModule,
    canViewModule,
    canEditModule,

    canCreateLane,
    canViewLane,
    canEditLane,
    canDeleteLane,

    canCreateSheet,
    canViewSheet,
    canEditSheet,

    canCreateCard,
    canViewCard,
    canEditCard,
    canAssignCard,
    canDeleteCard,

    canCreateVariable,
    canViewVariable,
    canEditVariable,
    canDeleteVariable,

    canCreateComment,
    canViewComment,
    canEditComment,
    canDeleteComment,

    canViewAttachment,
    canUploadAttachment,

    canInviteUser,
    canViewUser,
    canEditUser,
    canDeleteUser,
    canDeleteSheet,
    // Dynamic
    canAccessModule,
  };
}
