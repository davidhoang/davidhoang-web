"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./Nav.module.css";

export function Nav({
  as: _Component = _Builtin.NavbarWrapper,
  navLinkText3 = "Services",
  navLinkText2 = "About",
  navLinkText = "Newsletter",
  navLinkAdvisory = "Advisory",
  navLinkSubscribe = "Subscribe",
  navLinkResources = "Resources",
}) {
  return (
    <_Component
      className={_utils.cx(_styles, "nav-navbar")}
      tag="div"
      data-collapse="medium"
      data-animation="default"
      data-duration="400"
      data-doc-height="1"
      config={{
        animation: "default",
        easing: "ease",
        easing2: "ease",
        duration: 400,
        collapse: "medium",
        noScroll: false,
        docHeight: true,
      }}
    >
      <_Builtin.Block className={_utils.cx(_styles, "nav-container")} tag="div">
        <_Builtin.NavbarBrand
          className={_utils.cx(_styles, "brand")}
          options={{
            href: "#",
          }}
        >
          <_Builtin.Image
            className={_utils.cx(_styles, "nav-logo")}
            width="54"
            height="auto"
            loading="auto"
            alt=""
            src="https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/5edaa9a14bc6a59429133d6b_Logo%20-%20Main.svg"
          />
        </_Builtin.NavbarBrand>
        <_Builtin.NavbarMenu
          className={_utils.cx(_styles, "nav-menu")}
          tag="nav"
          role="navigation"
        >
          <_Builtin.NavbarLink
            className={_utils.cx(_styles, "nav-link")}
            options={{
              href: "#",
            }}
          >
            {"Writing"}
          </_Builtin.NavbarLink>
          <_Builtin.NavbarLink
            className={_utils.cx(_styles, "nav-link")}
            options={{
              href: "#",
            }}
          >
            {navLinkText2}
          </_Builtin.NavbarLink>
          <_Builtin.NavbarLink
            className={_utils.cx(_styles, "nav-link")}
            options={{
              href: "#",
            }}
          >
            {navLinkAdvisory}
          </_Builtin.NavbarLink>
          <_Builtin.NavbarLink
            className={_utils.cx(_styles, "nav-link")}
            options={{
              href: "#",
            }}
          >
            {"Featured"}
          </_Builtin.NavbarLink>
          <_Builtin.NavbarLink
            className={_utils.cx(_styles, "nav-link")}
            options={{
              href: "#",
            }}
          >
            {navLinkSubscribe}
          </_Builtin.NavbarLink>
        </_Builtin.NavbarMenu>
        <_Builtin.NavbarButton
          className={_utils.cx(_styles, "menu-button")}
          tag="div"
        >
          <_Builtin.Icon
            className={_utils.cx(_styles, "icon")}
            widget={{
              type: "icon",
              icon: "nav-menu",
            }}
          />
        </_Builtin.NavbarButton>
      </_Builtin.Block>
    </_Component>
  );
}
