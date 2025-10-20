"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./BannerZine.module.css";

export function BannerZine({ as: _Component = _Builtin.Block }) {
  return (
    <_Component className={_utils.cx(_styles, "banner-zine")} tag="div">
      <_Builtin.Block
        className={_utils.cx(_styles, "banner-zine-text")}
        tag="div"
      >
        {"Proof of Concept:The 000 Series is now available!"}
      </_Builtin.Block>
      <_Builtin.Link
        className={_utils.cx(_styles, "banner-zine-lcta")}
        button={false}
        block=""
        options={{
          href: "https://davidhoang.gumroad.com/l/proof-of-concept-000-series",
          target: "_blank",
        }}
      >
        {"Get the zine"}
      </_Builtin.Link>
    </_Component>
  );
}
