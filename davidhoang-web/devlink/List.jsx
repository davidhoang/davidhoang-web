"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./List.module.css";

export function List({ as: _Component = _Builtin.Block, title = "2021" }) {
  return (
    <_Component tag="div">
      <_Builtin.Heading tag="h3">{title}</_Builtin.Heading>
      <_Builtin.List
        className={_utils.cx(_styles, "list")}
        tag="ul"
        unstyled={false}
      >
        <_Builtin.ListItem className={_utils.cx(_styles, "", "list-item")}>
          {
            "April - Figma Config:The Universal Challenges of Every Scaling Design Team"
          }
        </_Builtin.ListItem>
        <_Builtin.ListItem className={_utils.cx(_styles, "list-item")}>
          {"March - Design Career Network - From Designer to Manager"}
        </_Builtin.ListItem>
        <_Builtin.ListItem className={_utils.cx(_styles, "list-item")}>
          {"January - Product Hive:Lessons Learned in Prototyping"}
        </_Builtin.ListItem>
      </_Builtin.List>
    </_Component>
  );
}
