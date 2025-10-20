"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./NavNotes.module.css";

export function NavNotes({ as: _Component = _Builtin.Block }) {
  return (
    <_Component className={_utils.cx(_styles, "nav-notes")} tag="div">
      <_Builtin.Link
        className={_utils.cx(_styles, "nav-notes-david")}
        button={false}
        block="inline"
        options={{
          href: "#",
          preload: "none",
        }}
      >
        <_Builtin.Image
          loading="lazy"
          width="auto"
          height="auto"
          alt=""
          src="https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/60f45c0c61bb0c7104c4db07_img-notes-dh.png"
        />
      </_Builtin.Link>
      <_Builtin.Heading tag="h1">{"DH's Notes"}</_Builtin.Heading>
      <_Builtin.Paragraph>
        {"Musings, thoughts, and ideas—more notes than writing."}
      </_Builtin.Paragraph>
    </_Component>
  );
}
