"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./HeroText.module.css";

export function HeroText({
  as: _Component = _Builtin.Block,
  h1GiantHeroText = "Contact",
}) {
  return (
    <_Component className={_utils.cx(_styles, "hero-text")} tag="div">
      <_Builtin.Heading
        className={_utils.cx(_styles, "h1-giant-hero")}
        tag="h1"
      >
        {h1GiantHeroText}
      </_Builtin.Heading>
    </_Component>
  );
}
