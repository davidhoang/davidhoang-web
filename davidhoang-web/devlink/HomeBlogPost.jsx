"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _interactions from "./interactions";
import * as _utils from "./utils";
import _styles from "./HomeBlogPost.module.css";

const _interactionsData = JSON.parse(
  '{"events":{"e":{"id":"e","name":"","animationType":"custom","eventTypeId":"MOUSE_OVER","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"894ed880-f5bb-4bc2-d47a-6ab9cdcf7532","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"894ed880-f5bb-4bc2-d47a-6ab9cdcf7532","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1653258372356}},"actionLists":{"a":{"id":"a","title":"New Timed Animation","actionItemGroups":[],"useFirstGroupAsInitialState":false,"createdOn":1653258387607}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function HomeBlogPost({
  as: _Component = _Builtin.Block,
  divBlock85Text = "",
}) {
  _interactions.useInteractions(_interactionsData, _styles);
  return (
    <_Component className={_utils.cx(_styles, "homeblogpost")} tag="div">
      <_Builtin.Block
        className={_utils.cx(_styles, "section-headline")}
        tag="div"
      >
        <_Builtin.Block
          className={_utils.cx(_styles, "bookshelf-collection")}
          tag="div"
        >
          <_Builtin.NotSupported _atom="DynamoWrapper" />
        </_Builtin.Block>
      </_Builtin.Block>
    </_Component>
  );
}
