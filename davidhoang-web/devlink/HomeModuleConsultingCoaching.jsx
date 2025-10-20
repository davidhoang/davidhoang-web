"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import { ButtonCta } from "./ButtonCta";
import * as _utils from "./utils";
import _styles from "./HomeModuleConsultingCoaching.module.css";

export function HomeModuleConsultingCoaching({
  as: _Component = _Builtin.Row,
}) {
  return (
    <_Component
      className={_utils.cx(_styles, "homesectionright")}
      tag="div"
      columns={{
        main: "6|6",
        medium: "",
        small: "",
        tiny: "",
      }}
    >
      <_Builtin.Column tag="div">
        <_Builtin.Heading tag="h2">{"Consulting &Coaching"}</_Builtin.Heading>
        <_Builtin.Paragraph className={_utils.cx(_styles, "paragraph")}>
          {
            "Looking for help with your startup or seeking career advice?I can help advise for your startup and provide 1:1 coaching for product and design."
          }
        </_Builtin.Paragraph>
        <ButtonCta
          ctaText="Hire me"
          link={{
            href: "#",
            preload: "none",
          }}
        />
      </_Builtin.Column>
      <_Builtin.Column tag="div">
        <_Builtin.Image
          className={_utils.cx(_styles, "imagefullwidth")}
          width="500"
          height="auto"
          loading="auto"
          alt="Photo for consulting"
          src="https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/5e79404fb4cf371239b4bf5f_img-home-consulting%402x.jpeg"
        />
      </_Builtin.Column>
    </_Component>
  );
}
