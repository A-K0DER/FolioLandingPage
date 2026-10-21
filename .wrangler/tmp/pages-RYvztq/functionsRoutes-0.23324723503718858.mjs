import { onRequestPost as __api_subscribe_ts_onRequestPost } from "/Users/ayushkumar/personalProjects/Folio/FolioLandingPage/functions/api/subscribe.ts"
import { onRequest as ___middleware_ts_onRequest } from "/Users/ayushkumar/personalProjects/Folio/FolioLandingPage/functions/_middleware.ts"

export const routes = [
    {
      routePath: "/api/subscribe",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_subscribe_ts_onRequestPost],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]