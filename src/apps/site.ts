import type { WebsiteProps } from "@decocms/apps/website/mod";

export type Platform = "custom";
export const _platform: Platform = "custom";

export type AppContext = {
  device: "mobile" | "desktop" | "tablet";
  platform: Platform;
};

/**
 * @title Site
 * @description Blog site app — defines schema and platform type.
 */
export interface Props extends WebsiteProps {
  platform?: Platform;
}

export default function Site(_props: Props) {
  return { state: _props };
}
