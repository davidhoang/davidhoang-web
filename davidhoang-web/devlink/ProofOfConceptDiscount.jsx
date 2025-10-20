"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./ProofOfConceptDiscount.module.css";

export function ProofOfConceptDiscount({ as: _Component = _Builtin.Block }) {
  return (
    <_Component className={_utils.cx(_styles, "div-block-113")} tag="div">
      <_Builtin.Block className={_utils.cx(_styles, "text-block-20")} tag="div">
        {"Get "}
        <_Builtin.Link
          className={_utils.cx(_styles, "link-10")}
          button={false}
          block=""
          options={{
            href: "#",
            target: "_blank",
          }}
        >
          {"50% off Proof of Concept"}
        </_Builtin.Link>
        {" until December 15, 2024"}
      </_Builtin.Block>
    </_Component>
  );
}
