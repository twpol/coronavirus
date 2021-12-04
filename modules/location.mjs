export const params = new URLSearchParams(location.search);

export function setQueryParam(name, value) {
  const newParams = new URLSearchParams(params);
  newParams.set(name, value);
  location.search = `?${newParams}`;
}
