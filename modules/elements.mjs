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

export function setChangeBackground(selector, change) {
  if (change > 0) {
    setStyleProp(
      selector,
      "background-color",
      "rgba(100%, 0%, 0%, " + Math.min(100, change) + "%)"
    );
  } else {
    setStyleProp(
      selector,
      "background-color",
      "rgba(0%, 100%, 0%, " + Math.min(100, -change) + "%)"
    );
  }
  setStyleProp(selector, "color", "black");
}

export function getPage(name) {
  return `${name}${location.hostname === "localhost" ? ".html" : ""}`;
}

export function $(name, ...children) {
  const element = document.createElement(name);
  element.append(...children);
  return element;
}
