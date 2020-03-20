"use strict";

import qs from "qs";
import { parse } from "url";
import omit from "./utils/omit";
import merge from "./utils/merge";

/* eslint no-useless-escape: 0 */
const rxClean = /(\(:[^\)]+\)|:[^\/]+\/?)/g;

/**
 * Url modification
 * @param  {String} url     url template
 * @param  {Object} params  params for url template
 * @param  {Object} options transformation options, accepts +delimiter+, +arrayFormat+,
 *                          +qsStringifyOptions+, +qsModifier+, +qsParseOptions+
 * @return {String}         result url
 */
export default function urlTransform(url, params, options) {
  if (!url) {
    return "";
  }
  params || (params = {});
  params = { ...params };
  options || (options = {});
  if (options.qsModifier) options.qsModifier(url, params, options);
  const usedKeys = {};
  const urlWithParams = Object.keys(params).reduce((url, key) => {
    const value = params[key];
    const rx = new RegExp(`(\\(:${key}\\)|:${key})(\/?)`, "g");
    return url.replace(rx, (_, _1, slash) => {
      usedKeys[key] = value;
      return value ? value + slash : value;
    });
  }, url);

  if (!urlWithParams) {
    return urlWithParams;
  }
  const { protocol, host, path } = parse(urlWithParams);
  const cleanURL = host
    ? `${protocol}//${host}${path.replace(rxClean, "")}`
    : path.replace(rxClean, "");
  const usedKeysArray = Object.keys(usedKeys);
  if (usedKeysArray.length !== Object.keys(params).length) {
    const urlObject = cleanURL.split("?");
    const { arrayFormat, delimiter } = options;
    const qsParseOptions = {
      arrayFormat,
      delimiter,
      ...options.qsParseOptions
    };
    const mergeParams = merge(
      urlObject[1] && qs.parse(urlObject[1], qsParseOptions),
      omit(params, usedKeysArray)
    );
    const qsStringifyOptions = {
      arrayFormat,
      delimiter,
      ...options.qsStringifyOptions
    };
    const urlStringParams = qs.stringify(mergeParams, qsStringifyOptions);
    return `${urlObject[0]}?${urlStringParams}`;
  }
  return cleanURL;
}
