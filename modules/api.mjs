const API_PROXY = "https://james-ross.co.uk/temp/proxy?cache=86400&url=";
const API_GENERIC = "https://coronavirus.data.gov.uk/api/generic/";
const API_DATA = "https://api.coronavirus.data.gov.uk/v1/data";

export async function fetchGenericApi(path, options) {
  return await (
    await fetch(API_PROXY + encodeURIComponent(API_GENERIC + path), options)
  ).json();
}

export async function fetchDataApi(query, options) {
  return await (
    await fetch(API_PROXY + encodeURIComponent(API_DATA + query), options)
  ).json();
}
