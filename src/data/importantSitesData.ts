import { ImportantSite, SiteFolder } from "../types";

export const INITIAL_SITE_FOLDERS: SiteFolder[] = [
  {
    id: "folder_veo",
    name: "VEO",
    color: "emerald",
    icon: "Folder",
    description: "Village Extension Office (VEO) Services & Portals",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "folder_general",
    name: "General",
    color: "blue",
    icon: "Folder",
    description: "General portals and external links",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];

export const INITIAL_IMPORTANT_SITES: ImportantSite[] = [
  {
    id: "site_veo_form_fillout",
    name: "VEO Form",
    category: "OTHER",
    customCategory: "VEO",
    folder: "VEO",
    url: "https://forms.fillout.com/t/rckeaFvH5ous",
    username: "",
    password: "",
    securityPin: "",
    notes: "Official VEO Fillout Submission Form",
    isFavorite: true,
    color: "emerald",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];
