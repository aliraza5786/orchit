<script setup lang="ts">
import Table from "../../../components/ui/Table.vue";
import { h, ref, computed, watch } from "vue";
import { formatDate } from "../../../utilities/FormatDate";
import Collaborators from "../../../components/ui/Collaborators.vue";
import { useRouter } from "vue-router";
import type { Row } from "../../../components/ui/Table.vue";

const emit = defineEmits(["share", "archive", "delete", "invite"]);

const router = useRouter();

/* ------------ Column render helpers ------------ */
const dateCache = new Map<string, string>();
const getCachedDate = (dateStr: string) => {
  if (!dateCache.has(dateStr)) dateCache.set(dateStr, formatDate(dateStr));
  return dateCache.get(dateStr)!;
};
const handleClick = async (rowEvt: any) => {
  const r = rowEvt.row;
  const jobId: string | undefined = r?.LatestTask?.job_id;
  const workspaceId: string = r._id;

  const theme = localStorage.getItem("theme") || "light";
  const token = localStorage.getItem("token") ?? "";

  const peakPath = jobId
    ? `/workspace/peak/${workspaceId}/${jobId}`
    : `/workspace/peak/${workspaceId}`;

  const company = r?.company;
  const domainLink: string | undefined = company?.domain_link;

  // ── Personal workspace or Localhost ────────────────────────────────────────
  if (!domainLink || window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1") {
    if (jobId) {
      localStorage.setItem("jobId", jobId);
    } else {
      localStorage.removeItem("jobId");
    }
    router.push(peakPath);
    return;
  }

  // ── Company workspace — redirect to tenant subdomain ───────────────────────
  const queryParams = new URLSearchParams({ theme });

  // ✅ Pass token so tenant subdomain can save it to localStorage on load
  if (token) queryParams.set("_token", token);

  // ✅ Pass company_id as _cid so tenant subdomain can bootstrap it in storage
  if (company?._id) {
    const encode = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.');
    queryParams.set("_cid", encode(company._id));
  }

  const targetUrl = `${domainLink.replace(/\/$/, "")}${peakPath}?${queryParams.toString()}`;

  setTimeout(() => {
    window.location.href = targetUrl;
  }, 80);
};
const handleArchive = (row: any) => {
  emit("archive", row);
};

const openDeleteConfirm = (row: any) => {
  emit("delete", row);
};

const openShareModal = (row: any) => {
  emit("share", row);
};

const openInviteModal = (row: any) => {
  emit("invite", row);
};

const renderActions = ({ row }: any) => {
  if (props.filter === "deleted") return h("div", { class: "h-8" });

  const isArchived = props.filter === "archived";
  const archiveIcon = isArchived
    ? "fa-regular fa-box-archive"
    : "fa-solid fa-box-archive";
  const archiveTitle = isArchived ? "Unarchive" : "Archive";

  const btnClass =
    "p-2 hover:bg-bg-card rounded-lg transition-all duration-200 text-text-secondary hover:text-text-primary hover:scale-110 active:scale-95";

  return h(
    "div",
    {
      class:
        "flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300",
    },
    [
      row.has_permission_to_manage_user
        ? h(
            "button",
            {
              class: btnClass,
              onClick: (e: Event) => {
                e.stopPropagation();
                openShareModal(row);
              },
              title: "Share",
            },
            [h("i", { class: "fa-regular fa-share-nodes text-sm" })],
          )
        : null,

      row.has_permission_to_manage_user
        ? h(
            "button",
            {
              class: btnClass,
              onClick: (e: Event) => {
                e.stopPropagation();
                handleArchive(row);
              },
              title: archiveTitle,
            },
            [h("i", { class: `${archiveIcon} text-sm` })],
          )
        : null,

      row.has_permission_to_manage_user
        ? h(
            "button",
            {
              class:
                "p-2 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-red-500 hover:text-red-600 hover:scale-110 active:scale-95",
              onClick: (e: Event) => {
                e.stopPropagation();
                openDeleteConfirm(row);
              },
              title: "Delete",
            },
            [h("i", { class: "fa-regular fa-trash-can text-sm" })],
          )
        : null,
    ].filter(Boolean),
  );
};

const renderOrganization = ({ row }: any) => {
  const company = row?.company;
  if (!company)
    return h("span", { class: "text-text-secondary text-xs" }, "-----");

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  

  const goToDomain = (e: Event) => {
    e.stopPropagation();
    if (!company.domain_link) return;

    const theme = localStorage.getItem("theme") || "light";
    const queryParams = new URLSearchParams({ theme, company_id: company._id });

    if (window.location.hostname.includes("localhost") || window.location.hostname === "127.0.0.1") {
      router.push(`/dashboard?${queryParams.toString()}`);
      return;
    }

    const target = `${company.domain_link.replace(/\/$/, "")}/dashboard?${queryParams.toString()}`;

    window.location.href = target;
  };

  const avatar = company.logo
    ? h("img", {
        src: company.logo,
        alt: company.title,
        class: "h-6 w-6 rounded-full object-cover",
        loading: "lazy",
        decoding: "async",
      })
    : h(
        "div",
        {
          class:
            "h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-accent shrink-0",
        },
        getInitials(company.title),
      );

  const title = h(
    "span",
    {
      class: (company.domain_link
        ? "text-xs text-text-primary hover:underline cursor-pointer"
        : "text-xs text-text-primary") + " truncate",
      onClick: company.domain_link ? goToDomain : undefined,
      title: company.domain_link
        ? `Go to ${company.domain_link}`
        : company.title,
    },
    company.title,
  );

  return h("div", { class: "flex items-center gap-2 min-w-0" }, [avatar, title]);
};

const renderProject = ({ row, value }: any) => {
  const workspaceColor = row.variables?.["workspace-color"] || "#3b82f6";
  const initials = (value?.title || "W")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return h(
    "div",
    {
      class: "flex items-center gap-3 cursor-pointer h-full w-full group/title",
      onClick: (e: Event) => {
        e.stopPropagation();
        handleClick({ row });
      },
    },
    [
      row.logo
        ? h("img", {
            src: row.logo,
            alt: value?.title || "Project",
            class:
              "h-10 w-10 shrink-0 bg-bg-card rounded-xl object-cover border border-border/50 shadow-sm transition-transform group-hover/title:scale-105",
            loading: "lazy",
            decoding: "async",
          })
        : h(
            "div",
            {
              class:
                "h-10 w-10 shrink-0 rounded-xl border border-border/50 flex items-center justify-center text-white font-bold text-sm transition-transform group-hover/title:scale-105",
              style: { backgroundColor: workspaceColor },
            },
            initials,
          ),

      h("div", { class: "flex flex-col min-w-0 flex-1" }, [
        h(
          "span",
          {
            class:
              "font-semibold text-text-primary group-hover/title:text-accent transition-colors truncate text-[14px]",
          },
          value?.title || "Untitled",
        ),
        h(
          "span",
          { class: "text-[11px] text-text-secondary truncate opacity-70" },
          `Owner: ${row.owner?.name || "..."}`,
        ),
      ]),
    ],
  );
};

const renderCompanyPercentage = ({ row }: any) => {
  const percentage = row?.task_stats?.total_percentage ?? 0;
  const workspaceColor =
    row.variables?.["workspace-color"] || "var(--primary-color)";

  return h("div", { class: "flex items-center gap-3 w-full max-w-[160px]" }, [
    h(
      "div",
      {
        class:
          "flex-1 h-1.5 rounded-full bg-bg-card border border-border/30 overflow-hidden",
      },
      [
        h("div", {
          class: "h-full rounded-full transition-all duration-700 ease-out",
          style: { width: `${percentage}%`, backgroundColor: workspaceColor },
        }),
      ],
    ),
    h(
      "span",
      { class: "text-[11px] font-semibold text-text-primary w-8 text-right" },
      `${percentage}%`,
    ),
  ]);
};

const renderProjectType = ({ value }: any) => {
  const type = value?.["workspace-type"] || "personal";
  const isTeam = type === "team";

  return h(
    "span",
    {
      class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        isTeam
          ? "bg-accent/10 text-accent border border-accent/20"
          : "bg-bg-card text-text-secondary border border-border"
      }`,
    },
    isTeam ? "Organization" : type,
  );
};

const renderPeople = ({ row, value }: any) =>
  h("div", { class: "flex items-center -space-x-3" }, [
    h(Collaborators, { avatars: value || [], image: true, maxVisible: 3 }),
    h(
      "button",
      {
        class: row.has_permission_to_manage_user
          ? "flex justify-center items-center rounded-full border border-border text-xs bg-bg-dropdown cursor-pointer hover:bg-bg-dropdown-menu-hover transition h-8 w-8 cursor-pointer"
          : "hidden",
        onClick: (e: Event) => {
          e.stopPropagation();
          openInviteModal(row._id);
        },
        title: "Invite Users",
      },
      [h("i", { class: "fa-solid fa-plus text-gray-500 text-xs" })],
    ),
  ]);

const renderStartDate = ({ value }: any) => h("span", getCachedDate(value));

// const renderCompanyAdmin = ({ row }: any) => {
//   const owner = row?.owner
//   if (!owner) return h('span', '-')

//   const getInitials = (name: string) =>
//     name.split(' ').map((n: string) => n[0]).join('').toUpperCase()

//   const getColorFromString = (str: string) => {
//     let hash = 0
//     for (let i = 0; i < str.length; i++) {
//       hash = str.charCodeAt(i) + ((hash << 5) - hash)
//     }
//     return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`
//   }

//   return h('div', { class: 'flex items-center gap-2' }, [
//     owner.profile_img
//       ? h('img', {
//           src: owner.profile_img,
//           alt: owner.name,
//           class: 'h-6 w-6 rounded-full object-cover',
//           loading: 'lazy',
//           decoding: 'async',
//         })
//       : h('div', {
//           class: 'h-8 w-8 border-primary border-2 shadow-md flex items-center justify-center rounded-full text-white text-xs font-medium',
//           style: { backgroundColor: getColorFromString(owner.name) }
//         }, getInitials(owner.name)),
//     h('span', owner.name)
//   ])
// }

// column rendering helper functions...

const columns = [
  {
    key: "variables",
    label: "Workspace",
    render: renderProject,
    width: "200px",
  },
  {
    key: "variables",
    label: "Workspace Type",
    render: renderProjectType,
    width: "150px",
  },
  { key: "People", label: "People", render: renderPeople, width: "120px" },
  {
    key: "created_at",
    label: "Start Date",
    render: renderStartDate,
    width: "100px",
  },
  {
    key: "organization",
    label: "Organization",
    render: renderOrganization,
    width: "150px",
  },
  {
    key: "percentage",
    label: "Percentage",
    render: renderCompanyPercentage,
    width: "150px",
  },
  {
    key: "actions",
    label: "Actions",
    render: renderActions,
    align: "right" as const,
    width: "50px",
  },
];

const props = defineProps({
  filter: {
    type: String,
    default: "all",
  },
  workspaces: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const isLoading = computed(() => props.loading);
const items = computed(() => props.workspaces as Row[]);
const totalCount = ref(0);

watch(
  () => props.workspaces,
  (newVal) => {
    totalCount.value = newVal?.length ?? 0;
  },
  { immediate: true },
);

const emptyMessage = computed(() => {
  switch (props.filter) {
    case "archived":
      return "No archived workspaces";
    case "deleted":
      return "No deleted workspaces";
    case "private":
      return "No private workspaces";
    case "shared":
      return "No shared workspaces";
    default:
      return "No workspaces yet — create your first one";
  }
});
</script>

<template>
  <div class="workspace-module-wrapper">
    <div class="workspace-list-container">
      <Table
        v-if="isLoading || items.length"
        :columns="columns"
        :rows="items"
        :loading="isLoading"
        :pagination="false"
        :hover="false"
        :rowClass="() => 'group workspace-row'"
        headerBgClass="bg-bg-body"
      >
        <!-- ... existing templates ... -->

        <template #status="{ row }">
          <span
            class="px-3 py-1 rounded-full text-xs font-medium"
            :class="{
              'bg-blue-100 text-blue-600': row.status === 'In progress',
              'bg-red-100 text-red-600': row.status === 'Live',
              'bg-green-100 text-green-600': row.status === 'Done',
            }"
          >
            {{ row.status }}
          </span>
        </template>

        <template #team="{ row }">
          <div class="flex -space-x-2">
            <span
              v-for="(member, i) in row.Roles"
              :key="i"
              class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-xs"
            >
              {{ member }}
            </span>
          </div>
        </template>
      </Table>

      <!-- Custom empty state -->
      <div
        v-if="!isLoading && !items.length"
        class="flex flex-col items-center justify-center gap-4 py-24 text-center bg-bg-surface/30 rounded-3xl border border-dashed border-border"
      >
        <div class="relative">
          <div
            class="h-20 w-20 rounded-2xl bg-bg-card border border-border shadow-xl flex items-center justify-center"
          >
            <i
              class="fa-regular fa-folder-open text-3xl text-accent/40"
            ></i>
          </div>
          <div
            class="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent flex items-center justify-center text-white shadow-lg"
          >
            <i class="fa-solid fa-plus text-[10px]"></i>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <h3 class="text-base font-semibold text-text-primary">
            {{ emptyMessage }}
          </h3>
          <p class="text-sm text-text-secondary max-w-[280px]">
            {{
              props.filter === "all"
                ? "Get started by creating your first workspace to organize your tasks."
                : "Try switching to a different filter or check your settings."
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-module-wrapper {
  width: 100%;
}

.workspace-list-container {
  background: transparent;
  width: 100%;
}

/* Professional Scrollbar */
.workspace-list-container :deep(.overflow-auto) {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
  padding-bottom: 1rem;
}

.workspace-list-container :deep(.overflow-auto::-webkit-scrollbar) {
  width: 5px;
  height: 5px;
}

.workspace-list-container :deep(.overflow-auto::-webkit-scrollbar-thumb) {
  background-color: var(--border);
  border-radius: 10px;
}

.workspace-list-container :deep(table) {
  border-spacing: 0 !important;
  border-collapse: collapse !important;
  width: 100% !important;
}

.workspace-list-container :deep(td) {
  padding: 14px 16px !important;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  transition: background-color 0.15s ease;
  position: relative;
}

.workspace-list-container :deep(td:hover) {
  background-color: var(--bg-body) !important;
}

.workspace-list-container :deep(td:last-child:hover) {
  background-color: transparent !important;
}

.workspace-list-container :deep(.workspace-row) {
  border-bottom: none !important;
}

.workspace-list-container :deep(tr:last-child td) {
  border-bottom: none;
}

.workspace-list-container :deep(tr:last-child td) {
  border-bottom: none;
}

.workspace-list-container :deep(th) {
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 16px !important;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.workspace-list-container :deep(.workspace-row:hover .opacity-0) {
  opacity: 1;
}
</style>
