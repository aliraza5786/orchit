// src/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "../stores/auth";
import Task from "../views/Workspaces/Task.vue";
import Users from "../views/Workspaces/Users.vue";
import api from "../libs/api";
import type { AxiosError, AxiosResponse } from "axios";
import ReleaseNote from "../views/ReleaseNote.vue";
// Lazy imports = separate chunks
const Login = () => import("../views/Auth/Login.vue");
const Register = () => import("../views/Auth/Register.vue");
const OtpVerification = () => import("../views/Auth/OtpVerification.vue");
const CreateProfile = () => import("../views/Auth/CreateProfile.vue");
const ForgotPassword = () => import("../views/Auth/ForgotPassword.vue");
const ResetPassword = () => import("../views/Auth/ResetPassword.vue");
const FinishProfile = () => import("../views/FinishProfile.vue");
const NotFound = () => import("../views/NotFound.vue");
const ModuleDetail=()=> import( "../views/More/ModuleDetail.vue");

const Plan = () => import("../views/Plan/Plan.vue");
const Pin = () => import("../views/Pin/Pin.vue");
const LandingLayout = () =>
  import("../layout/mainLayout/LandingPageLayout.vue");
const Home = () => import("../views/Workspaces/Home.vue");
const CreateWorkspace = () =>
  import("../views/CreateWorkspace/CreateWorkspace.vue");
const WorkspaceLayout = () =>
  import("../layout/WorkspaceLayout/WorkspaceLayout.vue");
const Peak = () => import("../views/Peak.vue");
const People = () => import("../views/People/People.vue");
const Process = () => import("../views/Process/Process.vue");
const Process2 = () => import("../views/Process2/Process2.vue");
const More = () => import("../views/More/More.vue");
const Product = () => import("../views/Product/Product.vue");
const WorkspaceInvite = () => import("../views/Invites/WorkspaceInvite.vue");
const CompanyInvites = () => import("../views/Invites/CompanyInvites.vue");
const LandingPageLayout = () =>
  import("../layout/LandingPageLayout/LandingPageLayout.vue");

const LandingHome = () => import("../landingPageViews/LandingHome.vue");
const Pricing = () => import("../views/Pricing.vue");
const TermsOfServices = () => import("../views/TermsOfServices.vue");
const PrivactPolicy = () => import("../views/PrivacyPolicy.vue");
const ContactUs = () => import("../views/ContactUs.vue");
const BlogList = () => import("../views/blog/BlogList.vue");
const BlogDetail = () => import("../views/blog/BlogDetail.vue");
// const KnowledgeCenter = () => import("../layout/KnowledgeCenterLayout/KnowledgeCenter.vue");
const KnowledgeCenterView = () =>
  import("../views/KnowledgeCenter/KnowledgeCenterView.vue");

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: LandingPageLayout,
    children: [
      {
        path: "/",
        name: "landing-home-2",
        component: LandingHome,
        meta: { requiresAuth: false },
      },
      {
        path: "/home",
        name: "landing-home",
        component: LandingHome,
        meta: { requiresAuth: false },
      },
      {
        path: "/pricing",
        name: "pricing",
        component: Pricing,
        meta: { requiresAuth: false },
      },
      {
        path: "/terms-of-services",
        name: "terms-of-services",
        component: TermsOfServices,
        meta: { requiresAuth: false },
      },
      {
        path: "/privacy-policy",
        name: "privacy-policy",
        component: PrivactPolicy,
        meta: { requiresAuth: false },
      },
      {
        path: "/contact-us",
        name: "contact-us",
        component: ContactUs,
        meta: { requiresAuth: false },
      },
        {
        path: "/release-note",
        name: "release-note",
        component: ReleaseNote,
        meta: { requiresAuth: false },
      },
      {
        path: "/blogs",
        name: "blogList",
        component: BlogList,
        meta: { requiresAuth: false },
      },
      {
        path: "/blog/:id",
        name: "BlogDetail",
        component: BlogDetail,
        props: true,
        meta: { requiresAuth: false },
      },
    ],
  },
  // knowledge center
  {
    path: "/knowledge-center",
    component: KnowledgeCenterView,
    children: [
      {
        path: "/knowledge-center/:slug",
        name: "KnowledgeCenter",
        component: KnowledgeCenterView,
        props: true,
        meta: { requiresAuth: false },
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: { requiresAuth: false },
  },
  {
    path: "/otp-verification/:email",
    name: "Otp",
    component: OtpVerification,
    meta: { requiresAuth: false },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: ForgotPassword,
    meta: { requiresAuth: false },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPassword,
    meta: { requiresAuth: false },
  },
  {
    path: "/create-profile",
    name: "create-profile",
    component: CreateProfile,
    meta: { requiresAuth: false },
  },
  {
    path: "/finish-profile",
    name: "finishProfile",
    component: FinishProfile,
    meta: { requiresAuth: true },
  },
  // Invites (note unique names)
  {
    path: "/workspace-invite/:token",
    name: "workspaceInvite",
    component: WorkspaceInvite,
    meta: { requiresAuth: false },
  },
  {
    path: "/space-invite/:token",
    name: "spaceInvite",
    component: CompanyInvites,
    meta: { requiresAuth: false },
  },

  // App shell
  {
    path: "/dashboard",
    component: LandingLayout,
    // children use RELATIVE paths
    children: [
      { path: "", name: "Home", component: Home, meta: { requiresAuth: true } },
      {
        path: "task",
        name: "task",
        component: Task,
        meta: { requiresAuth: true },
      },
      {
        path: "users",
        name: "users",
        component: Users,
        meta: { requiresAuth: true },
      },
    ],
  },

  // Standalone
  {
    path: "/create-workspace/:id?",
    name: "create-workspace",
    component: CreateWorkspace,
    props: true,
    meta: { requiresAuth: false },
  },

  // Workspace area
  {
    path: "/workspace",
    component: WorkspaceLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "peak/:id/:job_id", name: "peakWithJob", component: Peak },
      { path: "peak/:id", name: "peak", component: Peak },
      { path: "people/:id", name: "people", component: People },
      { path: "pin/:id/:module_id", name: "pin", component: Pin },
      { path: "plan/:id", name: "plan", component: Plan },
      { path: "process/:id", name: "process", component: Process },
      { path: "more/:id", name: "more", component: More },
      { path: "more/detail/:id/:module_id", name: "moreDetail", component: ModuleDetail },
      { path: "process2/:id", name: "process2", component: Process2 },
      { path: ":id/:module_id", name: "product", component: Product },
    ],
  },

  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

// const router = createRouter({ history: createWebHistory(), routes });
const router = createRouter({ history: createWebHistory(), routes,

    scrollBehavior(_, __, savedPosition) {
    if (savedPosition) {
      // If user clicked back/forward, restore position
      return savedPosition
    } else {
      // Always scroll to top for new pages
      return { top: 0, behavior: 'smooth' } 
    }
  },
  
 });
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      auth.logout();
      router.replace({ name: "Login" });
    }
    return Promise.reject(error);
  }
);
// Guard: check any matched record (works with nested routes)
router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  if (!auth.initialized) {
    await auth.bootstrap();
  }

  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth === true
  );

  if (requiresAuth && !auth.isAuthenticated) {
    return next({ name: "Login" });
  }

  if (!requiresAuth && auth.isAuthenticated && to.name === "Login") {
    return next({ name: "Home" });
  }

  next();
});

export default router;
