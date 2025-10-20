"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./ModulesNewsletter.module.css";

export function ModulesNewsletter({ as: _Component = _Builtin.Section }) {
  return (
    <_Component
      className={_utils.cx(_styles, "componentnewsletter")}
      tag="div"
      grid={{
        type: "section",
      }}
    >
      <_Builtin.HtmlEmbed
        className={_utils.cx(_styles, "html-embed")}
        value="%3Ciframe%20src%3D%22https%3A%2F%2Fwww.proofofconcept.pub%2Fembed%22%20width%3D%22100%25%22%20height%3D%22150%22%20frameborder%3D%220%22%20scrolling%3D%22no%22%3E%3C%2Fiframe%3E"
      />
    </_Component>
  );
}
