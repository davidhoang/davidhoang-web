"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./HeroImage.module.css";

export function HeroImage({
  as: _Component = _Builtin.Section,
  image = "https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/5e0229f39802ed94d8ba55f3_hero-david-01.jpeg",
}) {
  return (
    <_Component
      className={_utils.cx(_styles, "hero-big-image")}
      tag="div"
      grid={{
        type: "section",
      }}
    />
  );
}
