"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./PromoZine.module.css";

export function PromoZine({
  as: _Component = _Builtin.Block,
  promoZineVisibility = true,
}) {
  return promoZineVisibility ? (
    <_Component className={_utils.cx(_styles, "promo-zine")} tag="div">
      <_Builtin.Block className={_utils.cx(_styles, "div-block-77")} tag="div">
        <_Builtin.Image
          loading="lazy"
          width="auto"
          height="auto"
          alt=""
          src="https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/62ca565fbd099af069eba777_img-100-zine.jpg"
        />
      </_Builtin.Block>
      <_Builtin.Block className={_utils.cx(_styles, "div-block-78")} tag="div">
        <_Builtin.Block
          className={_utils.cx(_styles, "div-block-79")}
          tag="div"
        >
          <_Builtin.Block
            className={_utils.cx(_styles, "div-block-80")}
            tag="div"
          >
            <_Builtin.Heading tag="h3">
              {"Proof of Concept:The 000 Series"}
            </_Builtin.Heading>
            <_Builtin.Block tag="div">
              {"Get the digital download for $13.00"}
            </_Builtin.Block>
          </_Builtin.Block>
          <_Builtin.Link
            className={_utils.cx(
              _styles,
              "button-primary-2",
              "bt-size-regular"
            )}
            button={true}
            block=""
            options={{
              href: "https://www.davidhoang.com/product/proof-of-concept-the-000-series",
            }}
          >
            {"Buy the zine"}
          </_Builtin.Link>
        </_Builtin.Block>
      </_Builtin.Block>
    </_Component>
  ) : null;
}
