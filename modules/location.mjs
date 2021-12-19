export const params = new URLSearchParams(location.search);

export function setQueryParam(name, value) {
  const newParams = new URLSearchParams(params);
  newParams.set(name, value);
  location.search = `?${newParams}`;
}

export function replaceQueryParam(name, value) {
  const newParams = new URLSearchParams(params);
  if (value) {
    newParams.set(name, value);
  } else {
    newParams.delete(name);
  }
  history.replaceState(null, '', `?${newParams}`);
}
