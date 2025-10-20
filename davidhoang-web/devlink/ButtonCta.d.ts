import * as React from "react";
import * as Types from "./types";

declare function ButtonCta(props: {
  as?: React.ElementType;
  ctaText?: React.ReactNode;
  link?: Types.Basic.Link;
}): React.JSX.Element;
