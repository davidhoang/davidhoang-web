"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./ModulesSidebar.module.css";

export function ModulesSidebar({
  as: _Component = _Builtin.Section,
  paragraphText = "I'm David.I also go by DH, and this is my blog.",
  imgSidebar = "https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/61ca26292c89ccea18cb8ea5_img-blog-dh%402x.png",
  sidebarImageVisibility = true,
  textHeading = "Blog roll",
}) {
  return (
    <_Component
      className={_utils.cx(_styles, "sidebar-about")}
      grid={{
        type: "section",
      }}
      tag="div"
    >
      <_Builtin.Block className={_utils.cx(_styles, "sidebar")} tag="div">
        <_Builtin.Block
          className={_utils.cx(_styles, "sidebar-blog-image")}
          tag="div"
        >
          {sidebarImageVisibility ? (
            <_Builtin.Image
              className={_utils.cx(_styles, "sidebar-image")}
              loading="lazy"
              width="auto"
              height="auto"
              alt=""
              src={imgSidebar}
            />
          ) : null}
        </_Builtin.Block>
      </_Builtin.Block>
      <_Builtin.Block className={_utils.cx(_styles, "sidebar")} tag="div">
        <_Builtin.Heading tag="h2">{textHeading}</_Builtin.Heading>
        <_Builtin.NotSupported _atom="DynamoWrapper" />
      </_Builtin.Block>
    </_Component>
  );
}
