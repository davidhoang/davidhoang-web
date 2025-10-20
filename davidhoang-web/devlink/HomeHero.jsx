"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./HomeHero.module.css";

export function HomeHero({ as: _Component = _Builtin.Block }) {
  return (
    <_Component
      className={_utils.cx(_styles, "hero-big-image", "home")}
      tag="div"
    >
      <_Builtin.Block className={_utils.cx(_styles, "hero")} tag="div">
        <_Builtin.Block
          className={_utils.cx(_styles, "container-main-hero")}
          tag="div"
        >
          <_Builtin.Block
            className={_utils.cx(_styles, "div-block-43")}
            tag="div"
          >
            <_Builtin.Heading tag="h2">{"Recent experience"}</_Builtin.Heading>
            <_Builtin.List tag="ul" unstyled={false}>
              <_Builtin.ListItem>
                <_Builtin.Block tag="div">
                  {"Head of Product Design at Webflow"}
                </_Builtin.Block>
              </_Builtin.ListItem>
              <_Builtin.ListItem>
                <_Builtin.Block tag="div">
                  {"Design Partner at On Deck"}
                </_Builtin.Block>
              </_Builtin.ListItem>
              <_Builtin.ListItem>
                <_Builtin.Block tag="div">
                  {"UXD Instructor at General Assembly"}
                </_Builtin.Block>
              </_Builtin.ListItem>
              <_Builtin.ListItem>
                <_Builtin.Block tag="div">
                  {"Head of Product Design at One Medical"}
                </_Builtin.Block>
              </_Builtin.ListItem>
              <_Builtin.ListItem>
                <_Builtin.Block tag="div">
                  {"Director of Mobile Design at Black Pixel"}
                </_Builtin.Block>
              </_Builtin.ListItem>
            </_Builtin.List>
          </_Builtin.Block>
        </_Builtin.Block>
      </_Builtin.Block>
    </_Component>
  );
}
