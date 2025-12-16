
interface Permission {
  _id: string;
  module_id?: string;
  slug?: string;
  [key: string]: any;
}

interface ModulePermission {
  module_id: string;
  can_create: boolean;
  can_view: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface FormattedPermissions {
  permission_ids: string[];
  module_permissions: ModulePermission[];
}

export function formatPermissionsPayload(
  allPermissions: Permission[],
  selectedIds: string[]
): FormattedPermissions {
  const permissionIds: string[] = [];
  const modulePermissionsMap = new Map<string, ModulePermission>();

  selectedIds.forEach((id) => {
    const perm = allPermissions.find((p) => p._id === id);
    if (!perm) return;

    const parts = id.split('_');
    const isModulePermission = parts.length === 2 && parts[1].length === 24;

    if (isModulePermission) {
      const moduleId = parts[1];
      
      if (!modulePermissionsMap.has(moduleId)) {
        modulePermissionsMap.set(moduleId, {
          module_id: moduleId,
          can_create: false,
          can_view: false,
          can_update: false,
          can_delete: false,
        });
      }

      const modulePerm = modulePermissionsMap.get(moduleId)!;
      const action = (perm.action || perm.slug || "").toLowerCase();

      if (action.includes("create")) modulePerm.can_create = true;
      if (action.includes("view") || action.includes("read")) modulePerm.can_view = true;
      if (action.includes("update") || action.includes("edit")) modulePerm.can_update = true;
      if (action.includes("delete") || action.includes("remove")) modulePerm.can_delete = true;
    } else {
      permissionIds.push(id);
    }
  });

  return {
    permission_ids: permissionIds,
    module_permissions: Array.from(modulePermissionsMap.values()),
  };
}
