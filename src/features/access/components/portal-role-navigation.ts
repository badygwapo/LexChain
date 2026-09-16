import type { ComponentType } from "react";
import HomeIcon from "@mui/icons-material/Home";
import DescriptionIcon from "@mui/icons-material/Description";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import PersonIcon from "@mui/icons-material/Person";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import RequestPageIcon from "@mui/icons-material/RequestPage";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import type { PortalNavigationItem } from "@/features/portal";

type PortalNavigationIcon = ComponentType<{ fontSize?: "small" }>;

const iconsByLabel: Record<string, PortalNavigationIcon> = {
  Dashboard: HomeIcon,
  Documents: DescriptionIcon,
  Categories: CategoryOutlinedIcon,
  Reports: AssessmentOutlinedIcon,
  Books: MenuBookIcon,
  "Document Requests": RequestPageIcon,
  "Shared Documents": DescriptionIcon,
  Invitations: EmailOutlinedIcon,
  "My E-copy Requests": RequestPageIcon,
  "Profile & Security": PersonIcon,
  "Upload Document": FileUploadIcon,
  Notifications: NotificationsNoneOutlinedIcon,
  "Office Settings": SettingsIcon,
  "User Accounts": PersonIcon,
  "Issuer Invitations": EmailOutlinedIcon,
  "Audit Logs": ScheduleIcon,
};

export function isPortalRouteActive(pathname: string, item: PortalNavigationItem): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getPortalNavigationIcon(item: PortalNavigationItem): PortalNavigationIcon {
  return iconsByLabel[item.label] ?? DescriptionIcon;
}
