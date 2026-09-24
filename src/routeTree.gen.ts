/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as DashboardRouteImport } from './routes/dashboard'
import { Route as SectionRouteImport } from './routes/$section'
const IndexRoute=IndexRouteImport.update({id:'/',path:'/',getParentRoute:()=>rootRouteImport} as any)
const DashboardRoute=DashboardRouteImport.update({id:'/dashboard',path:'/dashboard',getParentRoute:()=>rootRouteImport} as any)
const SectionRoute=SectionRouteImport.update({id:'/$section',path:'/$section',getParentRoute:()=>rootRouteImport} as any)
export interface FileRoutesByFullPath {'/':typeof IndexRoute;'/dashboard':typeof DashboardRoute;'/$section':typeof SectionRoute}
export interface FileRoutesByTo {'/':typeof IndexRoute;'/dashboard':typeof DashboardRoute;'/$section':typeof SectionRoute}
export interface FileRoutesById {'__root__':typeof rootRouteImport;'/':typeof IndexRoute;'/dashboard':typeof DashboardRoute;'/$section':typeof SectionRoute}
export interface FileRouteTypes {fileRoutesByFullPath:FileRoutesByFullPath;fullPaths:'/'|'/dashboard'|'/$section';fileRoutesByTo:FileRoutesByTo;to:'/'|'/dashboard'|'/$section';id:'__root__'|'/'|'/dashboard'|'/$section';fileRoutesById:FileRoutesById}
export interface RootRouteChildren {IndexRoute:typeof IndexRoute;DashboardRoute:typeof DashboardRoute;SectionRoute:typeof SectionRoute}
declare module '@tanstack/react-router' { interface FileRoutesByPath {'/':{id:'/';path:'/';fullPath:'/';preLoaderRoute:typeof IndexRouteImport;parentRoute:typeof rootRouteImport};'/dashboard':{id:'/dashboard';path:'/dashboard';fullPath:'/dashboard';preLoaderRoute:typeof DashboardRouteImport;parentRoute:typeof rootRouteImport};'/$section':{id:'/$section';path:'/$section';fullPath:'/$section';preLoaderRoute:typeof SectionRouteImport;parentRoute:typeof rootRouteImport}}}
const rootRouteChildren={IndexRoute,DashboardRoute,SectionRoute}
export const routeTree=rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register {ssr:true;router:Awaited<ReturnType<typeof getRouter>>;config:Awaited<ReturnType<typeof startInstance.getOptions>>} }