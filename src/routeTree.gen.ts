/* eslint-disable */
// @ts-nocheck
// Nested /login layout with child portal forms.
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as LoginRouteImport } from './routes/login'
import { Route as LoginIndexRouteImport } from './routes/login.index'
import { Route as LoginStudentRouteImport } from './routes/login.student'
import { Route as LoginStaffRouteImport } from './routes/login.staff'
import { Route as LoginAdminRouteImport } from './routes/login.admin'
import { Route as LoginParentRouteImport } from './routes/login.parent'
import { Route as SignupRouteImport } from './routes/signup'
import { Route as StudentIndexRouteImport } from './routes/student/index'
import { Route as StaffIndexRouteImport } from './routes/staff/index'
import { Route as StaffSectionRouteImport } from './routes/staff/$section'
import { Route as StaffMarksRouteImport } from './routes/staff/marks'
import { Route as AdminIndexRouteImport } from './routes/admin/index'
import { Route as AdminSectionRouteImport } from './routes/admin/$section'
import { Route as AdminRegisterRouteImport } from './routes/admin/register'
import { Route as ParentIndexRouteImport } from './routes/parent/index'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)

const LoginRoute = LoginRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
} as any)

const LoginIndexRoute = LoginIndexRouteImport.update({
  id: '/login/',
  path: '/',
  getParentRoute: () => LoginRoute,
} as any)

const LoginStudentRoute = LoginStudentRouteImport.update({
  id: '/login/student',
  path: '/student',
  getParentRoute: () => LoginRoute,
} as any)

const LoginStaffRoute = LoginStaffRouteImport.update({
  id: '/login/staff',
  path: '/staff',
  getParentRoute: () => LoginRoute,
} as any)

const LoginAdminRoute = LoginAdminRouteImport.update({
  id: '/login/admin',
  path: '/admin',
  getParentRoute: () => LoginRoute,
} as any)

const LoginParentRoute = LoginParentRouteImport.update({
  id: '/login/parent',
  path: '/parent',
  getParentRoute: () => LoginRoute,
} as any)

const SignupRoute = SignupRouteImport.update({
  id: '/signup',
  path: '/signup',
  getParentRoute: () => rootRouteImport,
} as any)

const StudentIndexRoute = StudentIndexRouteImport.update({
  id: '/student/',
  path: '/student/',
  getParentRoute: () => rootRouteImport,
} as any)

const StaffIndexRoute = StaffIndexRouteImport.update({
  id: '/staff/',
  path: '/staff/',
  getParentRoute: () => rootRouteImport,
} as any)

const StaffMarksRoute = StaffMarksRouteImport.update({
  id: '/staff/marks',
  path: '/staff/marks',
  getParentRoute: () => rootRouteImport,
} as any)

const StaffSectionRoute = StaffSectionRouteImport.update({
  id: '/staff/$section',
  path: '/staff/$section',
  getParentRoute: () => rootRouteImport,
} as any)

const AdminIndexRoute = AdminIndexRouteImport.update({
  id: '/admin/',
  path: '/admin/',
  getParentRoute: () => rootRouteImport,
} as any)

const AdminRegisterRoute = AdminRegisterRouteImport.update({
  id: '/admin/register',
  path: '/admin/register',
  getParentRoute: () => rootRouteImport,
} as any)

const AdminSectionRoute = AdminSectionRouteImport.update({
  id: '/admin/$section',
  path: '/admin/$section',
  getParentRoute: () => rootRouteImport,
} as any)

const ParentIndexRoute = ParentIndexRouteImport.update({
  id: '/parent/',
  path: '/parent/',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/login': typeof LoginRouteWithChildren
  '/login/': typeof LoginIndexRoute
  '/login/student': typeof LoginStudentRoute
  '/login/staff': typeof LoginStaffRoute
  '/login/admin': typeof LoginAdminRoute
  '/login/parent': typeof LoginParentRoute
  '/signup': typeof SignupRoute
  '/student/': typeof StudentIndexRoute
  '/staff/': typeof StaffIndexRoute
  '/staff/marks': typeof StaffMarksRoute
  '/staff/$section': typeof StaffSectionRoute
  '/admin/': typeof AdminIndexRoute
  '/admin/register': typeof AdminRegisterRoute
  '/admin/$section': typeof AdminSectionRoute
  '/parent/': typeof ParentIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/login': typeof LoginIndexRoute
  '/login/student': typeof LoginStudentRoute
  '/login/staff': typeof LoginStaffRoute
  '/login/admin': typeof LoginAdminRoute
  '/login/parent': typeof LoginParentRoute
  '/signup': typeof SignupRoute
  '/student': typeof StudentIndexRoute
  '/staff': typeof StaffIndexRoute
  '/staff/marks': typeof StaffMarksRoute
  '/staff/$section': typeof StaffSectionRoute
  '/admin': typeof AdminIndexRoute
  '/admin/register': typeof AdminRegisterRoute
  '/admin/$section': typeof AdminSectionRoute
  '/parent': typeof ParentIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/login': typeof LoginRouteWithChildren
  '/login/': typeof LoginIndexRoute
  '/login/student': typeof LoginStudentRoute
  '/login/staff': typeof LoginStaffRoute
  '/login/admin': typeof LoginAdminRoute
  '/login/parent': typeof LoginParentRoute
  '/signup': typeof SignupRoute
  '/student/': typeof StudentIndexRoute
  '/staff/': typeof StaffIndexRoute
  '/staff/marks': typeof StaffMarksRoute
  '/staff/$section': typeof StaffSectionRoute
  '/admin/': typeof AdminIndexRoute
  '/admin/register': typeof AdminRegisterRoute
  '/admin/$section': typeof AdminSectionRoute
  '/parent/': typeof ParentIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: keyof FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  to: keyof FileRoutesByTo
  id: keyof FileRoutesById
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  LoginRoute: typeof LoginRouteWithChildren
  SignupRoute: typeof SignupRoute
  StudentIndexRoute: typeof StudentIndexRoute
  StaffIndexRoute: typeof StaffIndexRoute
  StaffMarksRoute: typeof StaffMarksRoute
  StaffSectionRoute: typeof StaffSectionRoute
  AdminIndexRoute: typeof AdminIndexRoute
  AdminRegisterRoute: typeof AdminRegisterRoute
  AdminSectionRoute: typeof AdminSectionRoute
  ParentIndexRoute: typeof ParentIndexRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/login': { id: '/login'; path: '/login'; fullPath: '/login'; preLoaderRoute: typeof LoginRouteImport; parentRoute: typeof rootRouteImport }
    '/login/': { id: '/login/'; path: '/'; fullPath: '/login/'; preLoaderRoute: typeof LoginIndexRouteImport; parentRoute: typeof LoginRoute }
    '/login/student': { id: '/login/student'; path: '/student'; fullPath: '/login/student'; preLoaderRoute: typeof LoginStudentRouteImport; parentRoute: typeof LoginRoute }
    '/login/staff': { id: '/login/staff'; path: '/staff'; fullPath: '/login/staff'; preLoaderRoute: typeof LoginStaffRouteImport; parentRoute: typeof LoginRoute }
    '/login/admin': { id: '/login/admin'; path: '/admin'; fullPath: '/login/admin'; preLoaderRoute: typeof LoginAdminRouteImport; parentRoute: typeof LoginRoute }
    '/login/parent': { id: '/login/parent'; path: '/parent'; fullPath: '/login/parent'; preLoaderRoute: typeof LoginParentRouteImport; parentRoute: typeof LoginRoute }
    '/signup': { id: '/signup'; path: '/signup'; fullPath: '/signup'; preLoaderRoute: typeof SignupRouteImport; parentRoute: typeof rootRouteImport }
    '/student/': { id: '/student/'; path: '/student'; fullPath: '/student/'; preLoaderRoute: typeof StudentIndexRouteImport; parentRoute: typeof rootRouteImport }
    '/staff/': { id: '/staff/'; path: '/staff'; fullPath: '/staff/'; preLoaderRoute: typeof StaffIndexRouteImport; parentRoute: typeof rootRouteImport }
    '/staff/marks': { id: '/staff/marks'; path: '/staff/marks'; fullPath: '/staff/marks'; preLoaderRoute: typeof StaffMarksRouteImport; parentRoute: typeof rootRouteImport }
    '/staff/$section': { id: '/staff/$section'; path: '/staff/$section'; fullPath: '/staff/$section'; preLoaderRoute: typeof StaffSectionRouteImport; parentRoute: typeof rootRouteImport }
    '/admin/': { id: '/admin/'; path: '/admin'; fullPath: '/admin/'; preLoaderRoute: typeof AdminIndexRouteImport; parentRoute: typeof rootRouteImport }
    '/admin/register': { id: '/admin/register'; path: '/admin/register'; fullPath: '/admin/register'; preLoaderRoute: typeof AdminRegisterRouteImport; parentRoute: typeof rootRouteImport }
    '/admin/$section': { id: '/admin/$section'; path: '/admin/$section'; fullPath: '/admin/$section'; preLoaderRoute: typeof AdminSectionRouteImport; parentRoute: typeof rootRouteImport }
    '/parent/': { id: '/parent/'; path: '/parent'; fullPath: '/parent/'; preLoaderRoute: typeof ParentIndexRouteImport; parentRoute: typeof rootRouteImport }
  }
}

interface LoginRouteChildren {
  LoginIndexRoute: typeof LoginIndexRoute
  LoginStudentRoute: typeof LoginStudentRoute
  LoginStaffRoute: typeof LoginStaffRoute
  LoginAdminRoute: typeof LoginAdminRoute
  LoginParentRoute: typeof LoginParentRoute
}

const LoginRouteChildren: LoginRouteChildren = {
  LoginIndexRoute,
  LoginStudentRoute,
  LoginStaffRoute,
  LoginAdminRoute,
  LoginParentRoute,
}

const LoginRouteWithChildren = LoginRoute._addFileChildren(LoginRouteChildren)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  LoginRoute: LoginRouteWithChildren,
  SignupRoute,
  StudentIndexRoute,
  StaffIndexRoute,
  StaffMarksRoute,
  StaffSectionRoute,
  AdminIndexRoute,
  AdminRegisterRoute,
  AdminSectionRoute,
  ParentIndexRoute,
}

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
