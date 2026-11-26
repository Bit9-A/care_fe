import { useAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { ActiveLink, useFullPath, usePath } from "raviger";
import { Fragment, ReactNode, useMemo, useState } from "react";

import { navExpansionAtom } from "@/atoms/navExpansionAtom";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar } from "@/components/Common/Avatar";

const isChildActive = (link: NavigationLink) => {
  if (!link.children) return false;
  const currentPath = window.location.pathname;
  return link.children.some((child) => currentPath.startsWith(child.url));
};

const useNavExpansionState = (linkName: string, link: NavigationLink) => {
  const [storedState, setStoredState] = useAtom(navExpansionAtom(linkName));

  // If no stored state, default to whether a child is active
  const isOpen = storedState ?? isChildActive(link);

  return [isOpen, setStoredState] as const;
};

/** Icon plate: gives every item the same visual rhythm instead of a bare glyph. */
const iconPlate = (active: boolean) =>
  cn(
    "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
    "group-data-[collapsible=icon]:size-8",
    active
      ? "bg-[linear-gradient(135deg,#00a3ff,#0076be)] text-white shadow-[0_4px_10px_-5px_rgba(0,163,255,0.9)]"
      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700",
  );

export interface NavigationLink {
  /** Optional group label rendered above this link; consecutive links share it. */
  section?: string;
  header?: string;
  headerIcon?: ReactNode;
  name: string;
  url: string;
  icon?: ReactNode;
  visibility?: boolean;
  children?: NavigationLink[];
}

function NavLink({
  href,
  isSelected,
  activeClass,
  exactActiveClass,
  className,
  onClick,
  children,
}: {
  href: string;
  isSelected: boolean;
  activeClass?: string;
  exactActiveClass?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
}) {
  const resolvedExact = exactActiveClass ?? activeClass;
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <ActiveLink
      href={href}
      className={className}
      activeClass={activeClass}
      exactActiveClass={resolvedExact}
      onClick={(e) => {
        if (isSelected) {
          e.preventDefault();
          if (isMobile) {
            toggleSidebar();
          }
        }
        onClick?.(e);
      }}
    >
      {children}
    </ActiveLink>
  );
}

export function NavMain({ links }: { links: NavigationLink[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const path = usePath();

  const fullPath = useFullPath();
  const fullPathMap = useMemo(
    () =>
      fullPath.split("/").reduce(
        (acc, part) => ({
          ...acc,
          [part]: true,
        }),
        {} as Record<string, boolean>,
      ),
    [fullPath],
  );

  const isSelected = (url: string) => path === url;
  const isWithin = (url: string) =>
    !path || path === url || path.startsWith(`${url}/`);

  // Links keep their order; consecutive links with the same `section` share one label.
  const groups = useMemo(() => {
    const result: { section?: string; links: NavigationLink[] }[] = [];
    links
      .filter((link) => link.visibility !== false)
      .forEach((link) => {
        const last = result[result.length - 1];
        if (last && last.section === link.section) {
          last.links.push(link);
        } else {
          result.push({ section: link.section, links: [link] });
        }
      });
    return result;
  }, [links]);

  return (
    <SidebarGroup className="gap-0 px-2 py-1">
      <SidebarMenu className="gap-0.5">
        {groups.map((group) =>
          group.links.map((link, index) => (
            <Fragment key={link.name}>
              {index === 0 && group.section && !isCollapsed && (
                <li
                  className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 first:pt-1"
                  aria-hidden="true"
                >
                  {group.section}
                </li>
              )}
              {link.children ? (
                isCollapsed ? (
                  <PopoverMenu link={link} />
                ) : (
                  <CollapsibleNavItem
                    link={link}
                    fullPathMap={fullPathMap}
                    path={path}
                  />
                )
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={link.name}
                    className="group h-10 gap-2.5 rounded-xl font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <NavLink
                      href={link.url}
                      isSelected={isSelected(link.url)}
                      activeClass="relative bg-[#00a3ff]/10 font-semibold text-[#0076be] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-[#00a3ff] group-data-[collapsible=icon]:before:hidden"
                    >
                      {link.icon ? (
                        <span className={iconPlate(isWithin(link.url))}>
                          {link.icon}
                        </span>
                      ) : (
                        <Avatar
                          name={link.name}
                          className="size-7 -m-1 rounded-lg"
                        />
                      )}

                      <span className="ml-0.5 truncate group-data-[collapsible=icon]:hidden">
                        {link.name}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </Fragment>
          )),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function CollapsibleNavItem({
  link,
  fullPathMap,
  path,
}: {
  link: NavigationLink;
  fullPathMap: Record<string, boolean>;
  path: string | null;
}) {
  const [isOpen, handleOpenChange] = useNavExpansionState(link.name, link);

  const isSubItemSelected = (url: string) => path === url;

  return (
    <Collapsible
      asChild
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={link.name}
            className="cursor-pointer font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 data-[state=open]:bg-slate-50"
          >
            {link.icon ? (
              link.icon
            ) : (
              <Avatar name={link.name} className="size-6 -m-1 rounded-sm" />
            )}
            <span className="group-data-[collapsible=icon]:hidden ml-1">
              {link.name}
            </span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="border-l border-gray-300">
            {link.children
              ?.filter((link) => link.visibility !== false)
              .map((subItem) => (
                <Fragment key={subItem.name}>
                  {subItem.header && (
                    <div className="flex items-center gap-2 mt-2">
                      {subItem.headerIcon}
                      <span className="text-gray-400 uppercase text-xs font-bold">
                        {subItem.header}
                      </span>
                    </div>
                  )}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      className={
                        "relative text-slate-600 transition font-medium hover:bg-slate-100 hover:text-slate-900"
                      }
                    >
                      <NavLink
                        href={subItem.url}
                        isSelected={isSubItemSelected(subItem.url)}
                        className="w-full"
                        activeClass={cn(
                          subItem.url
                            .split("/")
                            .every((part) => fullPathMap[part]) &&
                            "bg-[#00a3ff]/10 font-medium text-[#0076be]",
                        )}
                        exactActiveClass="bg-[#00a3ff]/10 font-medium text-[#0076be]"
                      >
                        {subItem.name}
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </Fragment>
              ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavItem({
  item,
  setOpen,
}: {
  item: NavigationLink;
  setOpen: (open: boolean) => void;
}) {
  const path = usePath();
  const selected = path === item.url;

  return (
    <NavLink
      href={item.url}
      isSelected={selected}
      className="w-full rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100"
      activeClass="bg-[#00a3ff]/10 font-medium text-[#0076be]"
      onClick={() => setOpen(false)}
    >
      {item.name}
    </NavLink>
  );
}

function PopoverMenu({ link }: { link: NavigationLink }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          tooltip={link.name}
          className={cn(
            "cursor-pointer font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            {
              "bg-[#00a3ff]/10 font-medium text-[#0076be]": isChildActive(link),
            },
          )}
        >
          {link.icon ? (
            link.icon
          ) : (
            <Avatar name={link.name} className="size-6 -m-1 rounded-sm" />
          )}
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-56 max-w-[calc(100vw-2.5rem)] p-1"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          {link.children?.map((subItem) => (
            <NavItem key={subItem.name} item={subItem} setOpen={setOpen} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
