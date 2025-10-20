"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./ModuleNewsletter.module.css";

export function ModuleNewsletter({ as: _Component = _Builtin.Block }) {
  return (
    <_Component
      className={_utils.cx(_styles, "container-single-page")}
      tag="div"
    >
      <_Builtin.Block
        className={_utils.cx(_styles, "newsletter-content")}
        tag="div"
      >
        <_Builtin.HtmlEmbed
          className={_utils.cx(_styles, "html-embed")}
          value="%3Ciframe%20src%3D%22https%3A%2F%2Fdavidhoang.substack.com%2Fembed%22%20width%3D%22100%25%22%20height%3D%22180%22%20width%3D%22100%25%22%20style%3D%22padding%3A%200px%3B%22%20align%3D%22left%22%20frameborder%3D%220%22%20scrolling%3D%22no%22%3E%3C%2Fiframe%3E"
        />
      </_Builtin.Block>
    </_Component>
  );
}
