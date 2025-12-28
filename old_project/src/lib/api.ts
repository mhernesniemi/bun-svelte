import { treaty } from "@elysiajs/eden";
import type { App } from "../index";

// Use current hostname and port from browser, fallback to localhost:3000
const getApiBase = () => {
  if (typeof window !== "undefined") {
    return window.location.host;
  }
  return process.env.API_BASE_URL || "localhost:3000";
};

export const api = treaty<App>(getApiBase());
