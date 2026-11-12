import { useMemo } from "react";

export default function useSidebarState() {
  return useMemo(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sidebar:state"));

    if (cookie) {
      const value = cookie.split("=")[1];
      return value === "true";
    }

    // Default to expanded so navigation labels are visible on desktop;
    // the only SidebarTrigger lives inside the mobile header.
    return true;
  }, []);
}
