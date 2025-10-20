"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./Footer.module.css";

export function Footer({
  as: _Component = _Builtin.Block,
  footerH4Text3 = "On the web",
  footerH4Text2 = "Fun shenanigans",
  footerLinkText = "Now",
  textBlock17Text = "Blog: ",
  copyrightTextText = (
    <>
      {"© David Hoang 2001-2024"}
      <br />
    </>
  ),
  footerH4Text = "Fun",
}) {
  return (
    <_Component className={_utils.cx(_styles, "footer")} tag="div">
      <_Builtin.Block
        className={_utils.cx(_styles, "footer-main-content")}
        tag="div"
      >
        <_Builtin.Block
          className={_utils.cx(_styles, "footer-container")}
          tag="div"
        >
          <_Builtin.Block
            className={_utils.cx(_styles, "paragraph-large")}
            tag="div"
          >
            {"david[at]davidhoang.com"}
          </_Builtin.Block>
          <_Builtin.Block
            className={_utils.cx(_styles, "footer-grid")}
            tag="div"
          >
            <_Builtin.Block tag="div">
              <_Builtin.Heading tag="h3">{footerH4Text3}</_Builtin.Heading>
              <_Builtin.List
                className={_utils.cx(_styles, "list-2")}
                tag="ul"
                unstyled={true}
              >
                <_Builtin.ListItem
                  list={{
                    type: "",
                  }}
                >
                  <_Builtin.Link
                    className={_utils.cx(_styles, "footer-link")}
                    button={false}
                    block=""
                    options={{
                      href: "http://twitter.com/davidhoang",
                    }}
                  >
                    {"Twitter"}
                  </_Builtin.Link>
                </_Builtin.ListItem>
                <_Builtin.ListItem
                  list={{
                    type: "",
                  }}
                >
                  <_Builtin.Link
                    className={_utils.cx(_styles, "footer-link")}
                    button={false}
                    block=""
                    options={{
                      href: "https://indieweb.social/@dh",
                    }}
                  >
                    {"Mastodon"}
                  </_Builtin.Link>
                </_Builtin.ListItem>
                <_Builtin.ListItem
                  list={{
                    type: "",
                  }}
                >
                  <_Builtin.Link
                    className={_utils.cx(_styles, "footer-link")}
                    button={false}
                    block=""
                    options={{
                      href: "https://letterboxd.com/davidhoang",
                    }}
                  >
                    {"Letterboxd"}
                  </_Builtin.Link>
                </_Builtin.ListItem>
                <_Builtin.ListItem
                  list={{
                    type: "",
                  }}
                >
                  <_Builtin.Link
                    className={_utils.cx(_styles, "footer-link")}
                    button={false}
                    block=""
                    options={{
                      href: "http://blog.davidhoang.com",
                    }}
                  >
                    {"Blog"}
                  </_Builtin.Link>
                </_Builtin.ListItem>
              </_Builtin.List>
            </_Builtin.Block>
            <_Builtin.Block tag="div">
              <_Builtin.Heading tag="h3">{footerH4Text2}</_Builtin.Heading>
              <_Builtin.List
                className={_utils.cx(_styles, "list-2")}
                tag="ul"
                unstyled={true}
              >
                <_Builtin.ListItem
                  list={{
                    type: "",
                  }}
                >
                  <_Builtin.Link
                    className={_utils.cx(_styles, "footer-link")}
                    button={false}
                    block=""
                    options={{
                      href: "#",
                    }}
                  >
                    {footerLinkText}
                  </_Builtin.Link>
                </_Builtin.ListItem>
                <_Builtin.ListItem
                  list={{
                    type: "",
                  }}
                >
                  <_Builtin.Link
                    className={_utils.cx(_styles, "footer-link")}
                    button={false}
                    block=""
                    options={{
                      href: "#",
                    }}
                  >
                    {"Link Love"}
                  </_Builtin.Link>
                </_Builtin.ListItem>
                <_Builtin.ListItem
                  list={{
                    type: "",
                  }}
                >
                  <_Builtin.Link
                    className={_utils.cx(_styles, "footer-link")}
                    button={false}
                    block=""
                    options={{
                      href: "https://www.davidhoang.com/blog/rss.xml",
                    }}
                  >
                    {"RSS"}
                  </_Builtin.Link>
                </_Builtin.ListItem>
              </_Builtin.List>
            </_Builtin.Block>
            <_Builtin.Block
              className={_utils.cx(_styles, "footer-social-links")}
              id={_utils.cx(
                _styles,
                "w-node-_24c3870f-80df-250d-85ae-805249b19ff9-73e72e8b"
              )}
              tag="div"
            >
              <_Builtin.Link
                className={_utils.cx(_styles, "footer-social-link-block")}
                id={_utils.cx(
                  _styles,
                  "w-node-_8040cb24-95ab-9d3b-eb7e-c4b73e507a06-73e72e8b"
                )}
                button={false}
                block="inline"
                options={{
                  href: "http://twitter.com/davidhoang",
                  target: "_blank",
                }}
              >
                <_Builtin.Block
                  className={_utils.cx(_styles, "footer-social")}
                  tag="div"
                >
                  <_Builtin.Image
                    className={_utils.cx(_styles, "img-social")}
                    loading="lazy"
                    width="auto"
                    height="auto"
                    alt=""
                    src="https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/61ca71b9c403ddc7cda12fb9_icon-twitter.svg"
                  />
                </_Builtin.Block>
              </_Builtin.Link>
              <_Builtin.Link
                className={_utils.cx(_styles, "footer-social-link-block")}
                id={_utils.cx(
                  _styles,
                  "w-node-b202c3d9-58de-d598-365d-281fa6756fde-73e72e8b"
                )}
                button={false}
                block="inline"
                options={{
                  href: "https://www.figma.com/@davidhoang",
                }}
              >
                <_Builtin.Block
                  className={_utils.cx(_styles, "footer-social")}
                  tag="div"
                >
                  <_Builtin.Image
                    loading="lazy"
                    width="auto"
                    height="auto"
                    alt=""
                    src="https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/61ca716e00ce8e73bd13d4a0_Figma%20-%20Negative.svg"
                  />
                </_Builtin.Block>
              </_Builtin.Link>
              <_Builtin.Link
                className={_utils.cx(_styles, "footer-social-link-block")}
                id={_utils.cx(
                  _styles,
                  "w-node-_846d093f-b0d4-f59c-1f7b-7299df608139-73e72e8b"
                )}
                button={false}
                block="inline"
                options={{
                  href: "http://github.com/davidhoang",
                  target: "_blank",
                }}
              >
                <_Builtin.Block
                  className={_utils.cx(_styles, "footer-social")}
                  tag="div"
                >
                  <_Builtin.Image
                    loading="lazy"
                    width="auto"
                    height="auto"
                    alt=""
                    src="https://cdn.prod.website-files.com/5d9fbe1d951135a3d136b12d/61ca71b90ce83872ed93ad4a_icon-github.svg"
                  />
                </_Builtin.Block>
              </_Builtin.Link>
            </_Builtin.Block>
          </_Builtin.Block>
        </_Builtin.Block>
      </_Builtin.Block>
    </_Component>
  );
}
