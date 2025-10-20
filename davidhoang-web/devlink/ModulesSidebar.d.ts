import * as React from "react";
import * as Types from "./types";

declare function ModulesSidebar(props: {
  as?: React.ElementType;
  paragraphText?: React.ReactNode;
  imgSidebar?: Types.Asset.Image;
  sidebarImageVisibility?: Types.Visibility.VisibilityConditions;
  textHeading?: React.ReactNode;
}): React.JSX.Element;
