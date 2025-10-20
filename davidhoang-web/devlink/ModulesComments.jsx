"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./ModulesComments.module.css";

export function ModulesComments({ as: _Component = _Builtin.Section }) {
  return (
    <_Component
      className={_utils.cx(_styles, "componentcomments")}
      tag="div"
      grid={{
        type: "section",
      }}
    >
      <_Builtin.HtmlEmbed value="%3Cdiv%20id%3D%22disqus_thread%22%3E%3C%2Fdiv%3E%0A%3Cscript%3E%0A%20%20%20%20%2F**%0A%20%20%20%20*%20%20RECOMMENDED%20CONFIGURATION%20VARIABLES%3A%20EDIT%20AND%20UNCOMMENT%20THE%20SECTION%20BELOW%20TO%20INSERT%20DYNAMIC%20VALUES%20FROM%20YOUR%20PLATFORM%20OR%20CMS.%0A%20%20%20%20*%20%20LEARN%20WHY%20DEFINING%20THESE%20VARIABLES%20IS%20IMPORTANT%3A%20https%3A%2F%2Fdisqus.com%2Fadmin%2Funiversalcode%2F%23configuration-variables%20%20%20%20*%2F%0A%20%20%20%20%2F*%0A%20%20%20%20var%20disqus_config%20%3D%20function%20()%20%7B%0A%20%20%20%20this.page.url%20%3D%20PAGE_URL%3B%20%20%2F%2F%20Replace%20PAGE_URL%20with%20your%20page's%20canonical%20URL%20variable%0A%20%20%20%20this.page.identifier%20%3D%20PAGE_IDENTIFIER%3B%20%2F%2F%20Replace%20PAGE_IDENTIFIER%20with%20your%20page's%20unique%20identifier%20variable%0A%20%20%20%20%7D%3B%0A%20%20%20%20*%2F%0A%20%20%20%20(function()%20%7B%20%2F%2F%20DON'T%20EDIT%20BELOW%20THIS%20LINE%0A%20%20%20%20var%20d%20%3D%20document%2C%20s%20%3D%20d.createElement('script')%3B%0A%20%20%20%20s.src%20%3D%20'https%3A%2F%2Fdavidhoangdotcom.disqus.com%2Fembed.js'%3B%0A%20%20%20%20s.setAttribute('data-timestamp'%2C%20%2Bnew%20Date())%3B%0A%20%20%20%20(d.head%20%7C%7C%20d.body).appendChild(s)%3B%0A%20%20%20%20%7D)()%3B%0A%3C%2Fscript%3E%0A%3Cnoscript%3EPlease%20enable%20JavaScript%20to%20view%20the%20%3Ca%20href%3D%22https%3A%2F%2Fdisqus.com%2F%3Fref_noscript%22%3Ecomments%20powered%20by%20Disqus.%3C%2Fa%3E%3C%2Fnoscript%3E" />
    </_Component>
  );
}
