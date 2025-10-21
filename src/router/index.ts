// src/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { isAuthenticated } from "../stores/auth";
import Task from "../views/Workspaces/Task.vue";
import Users from "../views/Workspaces/Users.vue";

// Lazy imports = separate chunks
const Login = () => import("../views/Auth/Login.vue");
const Register = () => import("../views/Auth/Register.vue");
const OtpVerification = () => import("../views/Auth/OtpVerification.vue");
const CreateProfile = () => import("../views/Auth/CreateProfile.vue");
const FinishProfile = () => import("../views/FinishProfile.vue");
const NotFound = () => import("../views/NotFound.vue");
const LandingLayout = () =>
  import("../layout/mainLayout/LandingPageLayout.vue");
const Home = () => import("../views/Workspaces/Home.vue");
const ProfileView = () => import("../views/Profile/ProfileView.vue");
const ManageAccount = () => import("../views/Profile/ManageAccount.vue");
const CreateWorkspace = () =>
  import("../views/CreateWorkspace/CreateWorkspace.vue");
const WorkspaceLayout = () =>
  import("../layout/WorkspaceLayout/WorkspaceLayout.vue");
const Peak = () => import("../views/Peak.vue");
const People = () => import("../views/People/People.vue");
const Process = () => import("../views/Process/Process.vue");
const More = () => import("../views/More/More.vue");
const Product = () => import("../views/Product/Product.vue");
const WorkspaceInvite = () => import("../views/Invites/WorkspaceInvite.vue");
const CompanyInvites = () => import("../views/Invites/CompanyInvites.vue");
const LandingPageLayout = () => import('../layout/LandingPageLayout/LandingPageLayout.vue');
const LandingHome = () => import('../landingPageViews/LandingHome.vue');
const Pricing = () => import("../views/Pricing.vue");
const  TermsOfServices = () => import("../views/TermsOfServices.vue");
const PrivactPolicy = () => import("../views/PrivacyPolicy.vue");
const ContactUs = () => import("../views/ContactUs.vue");
const BlogList = () => import("../views/blog/BlogList.vue");
const BlogDetail = () => import("../views/blog/BlogDetail.vue");
 

const routes: RouteRecordRaw[] = [
  {
    path: '/home',
    component: LandingPageLayout, children: [
      { path: '/home', name: 'landing-home', component: LandingHome, meta: { requiresAuth: false } },
      { path: '/pricing', name: 'pricing', component: Pricing, meta: { requiresAuth: false } },
      { path: '/terms-of-services', name: 'terms-of-services', component: TermsOfServices, meta: { requiresAuth: false } },
      { path: '/privacy-policy', name: 'privacy-policy', component: PrivactPolicy, meta: { requiresAuth: false } },
      { path: '/contact-us', name: 'contact-us', component: ContactUs, meta: { requiresAuth: false } },
      { path: '/blogs', name: 'blogList', component: BlogList, meta: { requiresAuth: false } }, 
      { path: '/blog/:slug', name: 'BlogDetail', component: BlogDetail, props: true, meta: { requiresAuth: false } },

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
    path: "/create-profile",
    name: "create-profile",
    component: CreateProfile,
    meta: { requiresAuth: false },
  },
  {
    path: "/finish-profile",
    name: "finish-profile",
    component: FinishProfile,
    meta: { requiresAuth: false },
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
    path: "/",
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
      {
        path: "profile",
        name: "profile",
        component: ProfileView,
        meta: { requiresAuth: true },
      },
      {
        path: "manage-account",
        name: "manage-account",
        component: ManageAccount,
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
    meta: { requiresAuth: true },
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
      { path: "process/:id", name: "process", component: Process },
      { path: "more/:id", name: "more", component: More },
      { path: ":id/:module_id", name: "product", component: Product },
    ],
  },

  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
];

const router = createRouter({ history: createWebHistory(), routes });

// Guard: check any matched record (works with nested routes)
router.beforeEach((to, _from, next) => {
  const authRequired = to.matched.some((r) => r.meta.requiresAuth);
  const isLoggedIn = isAuthenticated();

  if (authRequired && !isLoggedIn) return next("/login");
  if (!authRequired && isLoggedIn && to.name === "Login") return next("/");
  return next();
});

export default router;
