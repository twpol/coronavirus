import { params, replaceQueryParam } from "./location.mjs";

export function getElements() {
  const e = Object.create(null);
  for (const element of document.querySelectorAll("[id]")) {
    setByPath(e, element.id.split("-"), element);
  }
  return e;
}

function setByPath(root, path, value) {
  for (let i = 0; i < path.length - 1; i++) {
    root[path[i]] = root[path[i]] || Object.create(null);
    root = root[path[i]];
  }
  root[path[path.length - 1]] = value;
}

export function setText(selector, text) {
  setProp(selector, "innerText", text);
}

export function setProp(selector, name, value) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.warn("setProp: No elements matched " + selector);
  }
  for (const element of elements) {
    element[name] = value;
  }
}

export function setData(selector, name, value) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.warn("setData: No elements matched " + selector);
  }
  for (const element of elements) {
    element.dataset[name] = value;
  }
}

export function setStyleProp(selector, name, value) {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.warn("setStyleProp: No elements matched " + selector);
  }
  for (const element of elements) {
    element.style[name] = value;
  }
}

export function getChangeBackground(change) {
  if (change > 0) {
    return (
      "color: black; background-color: rgba(100%, 0%, 0%, " +
      Math.min(100, change) +
      "%)"
    );
  } else {
    return (
      "color: black; background-color: rgba(0%, 100%, 0%, " +
      Math.min(100, -change) +
      "%)"
    );
  }
}

export function getPage(name) {
  return `${name}${location.hostname === "localhost" ? ".html" : ""}`;
}

export function $(name, ...children) {
  const element = document.createElement(name);
  if (
    children.length &&
    Object.getPrototypeOf(children[0]) === Object.prototype
  ) {
    const attributes = children.shift();
    for (const attribute of Object.keys(attributes)) {
      element.setAttribute(attribute, attributes[attribute]);
    }
  }
  element.append(...children);
  return element;
}

function persistOptions() {
  const options = document.querySelectorAll("input[type=checkbox][id]");
  for (const option of options) {
    option.checked = !!params.get(option.id);
    document.body.classList.toggle("option-" + option.id, option.checked);

    option.addEventListener("change", function (event) {
      replaceQueryParam(event.target.id, event.target.checked ? "1" : "");
      document.body.classList.toggle(
        "option-" + event.target.id,
        event.target.checked
      );
    });
  }
}

setTimeout(persistOptions);
