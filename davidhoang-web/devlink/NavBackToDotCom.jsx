"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./NavBackToDotCom.module.css";

export function NavBackToDotCom({ as: _Component = _Builtin.Block }) {
  return (
    <_Component className={_utils.cx(_styles, "nav-notes-sticky")} tag="div">
      <_Builtin.Link
        className={_utils.cx(_styles, "link-7")}
        button={false}
        block=""
        options={{
          href: "#",
        }}
      >
        {"Back to davidhoang.com"}
      </_Builtin.Link>
    </_Component>
  );
}
