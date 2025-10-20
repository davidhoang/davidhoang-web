"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./ButtonCta.module.css";

export function ButtonCta({
  as: _Component = _Builtin.Link,
  ctaText = "Inquire",

  link = {
    href: "mailto:mailto:david@davidhoang.com",
  },
}) {
  return (
    <_Component
      className={_utils.cx(_styles, "button-primary-2", "bt-size-regular")}
      button={true}
      block=""
      options={link}
    >
      {ctaText}
    </_Component>
  );
}
