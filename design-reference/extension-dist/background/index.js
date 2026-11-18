var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
function _mergeNamespaces(n2, m2) {
  for (var i2 = 0; i2 < m2.length; i2++) {
    const e = m2[i2];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k in e) {
        if (k !== "default" && !(k in n2)) {
          const d2 = Object.getOwnPropertyDescriptor(e, k);
          if (d2) {
            Object.defineProperty(n2, k, d2.get ? d2 : {
              enumerable: true,
              get: () => e[k]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n2, Symbol.toStringTag, { value: "Module" }));
}
let FetchNon2xxError$1 = class FetchNon2xxError extends Error {
  constructor(res) {
    super(`${res.status} response status, check the response["body"] property`);
    /**
     * Response object that only contains what we need. Add additional Response properties as
     * needed.
     */
    __publicField(this, "response");
    this.name = "FetchNon2xxError";
    this.response = res;
  }
};
const DEBUG_BUILD$2 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const GLOBAL_OBJ = globalThis;
const SDK_VERSION = "10.48.0";
function getMainCarrier() {
  getSentryCarrier(GLOBAL_OBJ);
  return GLOBAL_OBJ;
}
function getSentryCarrier(carrier) {
  const __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
  __SENTRY__.version = __SENTRY__.version || SDK_VERSION;
  return __SENTRY__[SDK_VERSION] = __SENTRY__[SDK_VERSION] || {};
}
function getGlobalSingleton(name, creator, obj = GLOBAL_OBJ) {
  const __SENTRY__ = obj.__SENTRY__ = obj.__SENTRY__ || {};
  const carrier = __SENTRY__[SDK_VERSION] = __SENTRY__[SDK_VERSION] || {};
  return carrier[name] || (carrier[name] = creator());
}
const CONSOLE_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "log",
  "assert",
  "trace"
];
const PREFIX = "Sentry Logger ";
const originalConsoleMethods = {};
function consoleSandbox(callback) {
  if (!("console" in GLOBAL_OBJ)) {
    return callback();
  }
  const console2 = GLOBAL_OBJ.console;
  const wrappedFuncs = {};
  const wrappedLevels = Object.keys(originalConsoleMethods);
  wrappedLevels.forEach((level) => {
    const originalConsoleMethod = originalConsoleMethods[level];
    wrappedFuncs[level] = console2[level];
    console2[level] = originalConsoleMethod;
  });
  try {
    return callback();
  } finally {
    wrappedLevels.forEach((level) => {
      console2[level] = wrappedFuncs[level];
    });
  }
}
function enable() {
  _getLoggerSettings().enabled = true;
}
function disable() {
  _getLoggerSettings().enabled = false;
}
function isEnabled() {
  return _getLoggerSettings().enabled;
}
function log$1(...args) {
  _maybeLog("log", ...args);
}
function warn(...args) {
  _maybeLog("warn", ...args);
}
function error$5(...args) {
  _maybeLog("error", ...args);
}
function _maybeLog(level, ...args) {
  if (!DEBUG_BUILD$2) {
    return;
  }
  if (isEnabled()) {
    consoleSandbox(() => {
      GLOBAL_OBJ.console[level](`${PREFIX}[${level}]:`, ...args);
    });
  }
}
function _getLoggerSettings() {
  if (!DEBUG_BUILD$2) {
    return { enabled: false };
  }
  return getGlobalSingleton("loggerSettings", () => ({ enabled: false }));
}
const debug = {
  /** Enable logging. */
  enable,
  /** Disable logging. */
  disable,
  /** Check if logging is enabled. */
  isEnabled,
  /** Log a message. */
  log: log$1,
  /** Log a warning. */
  warn,
  /** Log an error. */
  error: error$5
};
const STACKTRACE_FRAME_LIMIT = 50;
const UNKNOWN_FUNCTION = "?";
const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
const STRIP_FRAME_REGEXP = /captureMessage|captureException/;
function createStackParser(...parsers) {
  const sortedParsers = parsers.sort((a2, b) => a2[0] - b[0]).map((p2) => p2[1]);
  return (stack, skipFirstLines = 0, framesToPop = 0) => {
    const frames = [];
    const lines = stack.split("\n");
    for (let i2 = skipFirstLines; i2 < lines.length; i2++) {
      let line = lines[i2];
      if (line.length > 1024) {
        line = line.slice(0, 1024);
      }
      const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, "$1") : line;
      if (cleanedLine.includes("Error: ")) {
        continue;
      }
      for (const parser of sortedParsers) {
        const frame = parser(cleanedLine);
        if (frame) {
          frames.push(frame);
          break;
        }
      }
      if (frames.length >= STACKTRACE_FRAME_LIMIT + framesToPop) {
        break;
      }
    }
    return stripSentryFramesAndReverse(frames.slice(framesToPop));
  };
}
function stripSentryFramesAndReverse(stack) {
  if (!stack.length) {
    return [];
  }
  const localStack = Array.from(stack);
  if (/sentryWrapped/.test(getLastStackFrame(localStack).function || "")) {
    localStack.pop();
  }
  localStack.reverse();
  if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
    localStack.pop();
    if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
      localStack.pop();
    }
  }
  return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame) => ({
    ...frame,
    filename: frame.filename || getLastStackFrame(localStack).filename,
    function: frame.function || UNKNOWN_FUNCTION
  }));
}
function getLastStackFrame(arr) {
  return arr[arr.length - 1] || {};
}
const defaultFunctionName = "<anonymous>";
function getFunctionName(fn) {
  try {
    if (!fn || typeof fn !== "function") {
      return defaultFunctionName;
    }
    return fn.name || defaultFunctionName;
  } catch {
    return defaultFunctionName;
  }
}
function getFramesFromEvent(event) {
  const exception = event.exception;
  if (exception) {
    const frames = [];
    try {
      exception.values.forEach((value) => {
        if (value.stacktrace.frames) {
          frames.push(...value.stacktrace.frames);
        }
      });
      return frames;
    } catch {
      return void 0;
    }
  }
  return void 0;
}
function getVueInternalName(value) {
  const isVNode = "__v_isVNode" in value && value.__v_isVNode;
  return isVNode ? "[VueVNode]" : "[VueViewModel]";
}
const handlers = {};
const instrumented = {};
function addHandler(type, handler) {
  handlers[type] = handlers[type] || [];
  handlers[type].push(handler);
}
function maybeInstrument(type, instrumentFn) {
  if (!instrumented[type]) {
    instrumented[type] = true;
    try {
      instrumentFn();
    } catch (e) {
      DEBUG_BUILD$2 && debug.error(`Error while instrumenting ${type}`, e);
    }
  }
}
function triggerHandlers(type, data) {
  const typeHandlers = type && handlers[type];
  if (!typeHandlers) {
    return;
  }
  for (const handler of typeHandlers) {
    try {
      handler(data);
    } catch (e) {
      DEBUG_BUILD$2 && debug.error(
        `Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`,
        e
      );
    }
  }
}
let _oldOnErrorHandler = null;
function addGlobalErrorInstrumentationHandler(handler) {
  const type = "error";
  addHandler(type, handler);
  maybeInstrument(type, instrumentError);
}
function instrumentError() {
  _oldOnErrorHandler = GLOBAL_OBJ.onerror;
  GLOBAL_OBJ.onerror = function(msg, url, line, column, error2) {
    const handlerData = {
      column,
      error: error2,
      line,
      msg,
      url
    };
    triggerHandlers("error", handlerData);
    if (_oldOnErrorHandler) {
      return _oldOnErrorHandler.apply(this, arguments);
    }
    return false;
  };
  GLOBAL_OBJ.onerror.__SENTRY_INSTRUMENTED__ = true;
}
let _oldOnUnhandledRejectionHandler = null;
function addGlobalUnhandledRejectionInstrumentationHandler(handler) {
  const type = "unhandledrejection";
  addHandler(type, handler);
  maybeInstrument(type, instrumentUnhandledRejection);
}
function instrumentUnhandledRejection() {
  _oldOnUnhandledRejectionHandler = GLOBAL_OBJ.onunhandledrejection;
  GLOBAL_OBJ.onunhandledrejection = function(e) {
    const handlerData = e;
    triggerHandlers("unhandledrejection", handlerData);
    if (_oldOnUnhandledRejectionHandler) {
      return _oldOnUnhandledRejectionHandler.apply(this, arguments);
    }
    return true;
  };
  GLOBAL_OBJ.onunhandledrejection.__SENTRY_INSTRUMENTED__ = true;
}
const objectToString = Object.prototype.toString;
function isError(wat) {
  switch (objectToString.call(wat)) {
    case "[object Error]":
    case "[object Exception]":
    case "[object DOMException]":
    case "[object WebAssembly.Exception]":
      return true;
    default:
      return isInstanceOf(wat, Error);
  }
}
function isBuiltin(wat, className) {
  return objectToString.call(wat) === `[object ${className}]`;
}
function isErrorEvent$1(wat) {
  return isBuiltin(wat, "ErrorEvent");
}
function isDOMError(wat) {
  return isBuiltin(wat, "DOMError");
}
function isDOMException(wat) {
  return isBuiltin(wat, "DOMException");
}
function isString(wat) {
  return isBuiltin(wat, "String");
}
function isParameterizedString(wat) {
  return typeof wat === "object" && wat !== null && "__sentry_template_string__" in wat && "__sentry_template_values__" in wat;
}
function isPrimitive(wat) {
  return wat === null || isParameterizedString(wat) || typeof wat !== "object" && typeof wat !== "function";
}
function isPlainObject(wat) {
  return isBuiltin(wat, "Object");
}
function isEvent(wat) {
  return typeof Event !== "undefined" && isInstanceOf(wat, Event);
}
function isElement(wat) {
  return typeof Element !== "undefined" && isInstanceOf(wat, Element);
}
function isRegExp(wat) {
  return isBuiltin(wat, "RegExp");
}
function isThenable(wat) {
  return Boolean((wat == null ? void 0 : wat.then) && typeof wat.then === "function");
}
function isSyntheticEvent(wat) {
  return isPlainObject(wat) && "nativeEvent" in wat && "preventDefault" in wat && "stopPropagation" in wat;
}
function isInstanceOf(wat, base) {
  try {
    return wat instanceof base;
  } catch {
    return false;
  }
}
function isVueViewModel(wat) {
  return !!(typeof wat === "object" && wat !== null && (wat.__isVue || wat._isVue || wat.__v_isVNode));
}
function isRequest(request) {
  return typeof Request !== "undefined" && isInstanceOf(request, Request);
}
const WINDOW$4 = GLOBAL_OBJ;
const DEFAULT_MAX_STRING_LENGTH = 80;
function htmlTreeAsString(elem, options = {}) {
  if (!elem) {
    return "<unknown>";
  }
  try {
    let currentElem = elem;
    const MAX_TRAVERSE_HEIGHT = 5;
    const out = [];
    let height = 0;
    let len = 0;
    const separator = " > ";
    const sepLength = separator.length;
    let nextStr;
    const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
    const maxStringLength = !Array.isArray(options) && options.maxStringLength || DEFAULT_MAX_STRING_LENGTH;
    while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
      nextStr = _htmlElementAsString(currentElem, keyAttrs);
      if (nextStr === "html" || height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength) {
        break;
      }
      out.push(nextStr);
      len += nextStr.length;
      currentElem = currentElem.parentNode;
    }
    return out.reverse().join(separator);
  } catch {
    return "<unknown>";
  }
}
function _htmlElementAsString(el2, keyAttrs) {
  const elem = el2;
  const out = [];
  if (!(elem == null ? void 0 : elem.tagName)) {
    return "";
  }
  if (WINDOW$4.HTMLElement) {
    if (elem instanceof HTMLElement && elem.dataset) {
      if (elem.dataset["sentryComponent"]) {
        return elem.dataset["sentryComponent"];
      }
      if (elem.dataset["sentryElement"]) {
        return elem.dataset["sentryElement"];
      }
    }
  }
  out.push(elem.tagName.toLowerCase());
  const keyAttrPairs = (keyAttrs == null ? void 0 : keyAttrs.length) ? keyAttrs.filter((keyAttr) => elem.getAttribute(keyAttr)).map((keyAttr) => [keyAttr, elem.getAttribute(keyAttr)]) : null;
  if (keyAttrPairs == null ? void 0 : keyAttrPairs.length) {
    keyAttrPairs.forEach((keyAttrPair) => {
      out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
    });
  } else {
    if (elem.id) {
      out.push(`#${elem.id}`);
    }
    const className = elem.className;
    if (className && isString(className)) {
      const classes = className.split(/\s+/);
      for (const c of classes) {
        out.push(`.${c}`);
      }
    }
  }
  for (const k of ["aria-label", "type", "name", "title", "alt"]) {
    const attr = elem.getAttribute(k);
    if (attr) {
      out.push(`[${k}="${attr}"]`);
    }
  }
  return out.join("");
}
function getLocationHref() {
  try {
    return WINDOW$4.document.location.href;
  } catch {
    return "";
  }
}
function getComponentName(elem) {
  if (!WINDOW$4.HTMLElement) {
    return null;
  }
  let currentElem = elem;
  const MAX_TRAVERSE_HEIGHT = 5;
  for (let i2 = 0; i2 < MAX_TRAVERSE_HEIGHT; i2++) {
    if (!currentElem) {
      return null;
    }
    if (currentElem instanceof HTMLElement) {
      if (currentElem.dataset["sentryComponent"]) {
        return currentElem.dataset["sentryComponent"];
      }
      if (currentElem.dataset["sentryElement"]) {
        return currentElem.dataset["sentryElement"];
      }
    }
    currentElem = currentElem.parentNode;
  }
  return null;
}
function fill(source, name, replacementFactory) {
  if (!(name in source)) {
    return;
  }
  const original = source[name];
  if (typeof original !== "function") {
    return;
  }
  const wrapped = replacementFactory(original);
  if (typeof wrapped === "function") {
    markFunctionWrapped(wrapped, original);
  }
  try {
    source[name] = wrapped;
  } catch {
    DEBUG_BUILD$2 && debug.log(`Failed to replace method "${name}" in object`, source);
  }
}
function addNonEnumerableProperty(obj, name, value) {
  try {
    Object.defineProperty(obj, name, {
      // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
      value,
      writable: true,
      configurable: true
    });
  } catch {
    DEBUG_BUILD$2 && debug.log(`Failed to add non-enumerable property "${name}" to object`, obj);
  }
}
function markFunctionWrapped(wrapped, original) {
  try {
    const proto = original.prototype || {};
    wrapped.prototype = original.prototype = proto;
    addNonEnumerableProperty(wrapped, "__sentry_original__", original);
  } catch {
  }
}
function getOriginalFunction(func) {
  return func.__sentry_original__;
}
function convertToPlainObject(value) {
  if (isError(value)) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
      ...getOwnProperties(value)
    };
  } else if (isEvent(value)) {
    const newObj = {
      type: value.type,
      target: serializeEventTarget(value.target),
      currentTarget: serializeEventTarget(value.currentTarget),
      ...getOwnProperties(value)
    };
    if (typeof CustomEvent !== "undefined" && isInstanceOf(value, CustomEvent)) {
      newObj.detail = value.detail;
    }
    return newObj;
  } else {
    return value;
  }
}
function serializeEventTarget(target) {
  try {
    return isElement(target) ? htmlTreeAsString(target) : Object.prototype.toString.call(target);
  } catch {
    return "<unknown>";
  }
}
function getOwnProperties(obj) {
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(Object.entries(obj));
  }
  return {};
}
function extractExceptionKeysForMessage(exception) {
  const keys = Object.keys(convertToPlainObject(exception));
  keys.sort();
  return !keys[0] ? "[object has no keys]" : keys.join(", ");
}
let RESOLVED_RUNNER;
function withRandomSafeContext(cb2) {
  if (RESOLVED_RUNNER !== void 0) {
    return RESOLVED_RUNNER ? RESOLVED_RUNNER(cb2) : cb2();
  }
  const sym = Symbol.for("__SENTRY_SAFE_RANDOM_ID_WRAPPER__");
  const globalWithSymbol = GLOBAL_OBJ;
  if (sym in globalWithSymbol && typeof globalWithSymbol[sym] === "function") {
    RESOLVED_RUNNER = globalWithSymbol[sym];
    return RESOLVED_RUNNER(cb2);
  }
  RESOLVED_RUNNER = null;
  return cb2();
}
function safeMathRandom() {
  return withRandomSafeContext(() => Math.random());
}
function safeDateNow() {
  return withRandomSafeContext(() => Date.now());
}
function truncate(str, max = 0) {
  if (typeof str !== "string" || max === 0) {
    return str;
  }
  return str.length <= max ? str : `${str.slice(0, max)}...`;
}
function safeJoin(input, delimiter) {
  if (!Array.isArray(input)) {
    return "";
  }
  const output = [];
  for (let i2 = 0; i2 < input.length; i2++) {
    const value = input[i2];
    try {
      if (isVueViewModel(value)) {
        output.push(getVueInternalName(value));
      } else {
        output.push(String(value));
      }
    } catch {
      output.push("[value cannot be serialized]");
    }
  }
  return output.join(delimiter);
}
function isMatchingPattern(value, pattern, requireExactStringMatch = false) {
  if (!isString(value)) {
    return false;
  }
  if (isRegExp(pattern)) {
    return pattern.test(value);
  }
  if (isString(pattern)) {
    return requireExactStringMatch ? value === pattern : value.includes(pattern);
  }
  if (typeof pattern === "function") {
    return pattern(value);
  }
  return false;
}
function stringMatchesSomePattern(testString, patterns = [], requireExactStringMatch = false) {
  return patterns.some((pattern) => isMatchingPattern(testString, pattern, requireExactStringMatch));
}
function getCrypto() {
  const gbl = GLOBAL_OBJ;
  return gbl.crypto || gbl.msCrypto;
}
let emptyUuid;
function getRandomByte() {
  return safeMathRandom() * 16;
}
function uuid4(crypto2 = getCrypto()) {
  try {
    if (crypto2 == null ? void 0 : crypto2.randomUUID) {
      return withRandomSafeContext(() => crypto2.randomUUID()).replace(/-/g, "");
    }
  } catch {
  }
  if (!emptyUuid) {
    emptyUuid = "10000000100040008000" + 1e11;
  }
  return emptyUuid.replace(
    /[018]/g,
    (c) => (
      // eslint-disable-next-line no-bitwise
      (c ^ (getRandomByte() & 15) >> c / 4).toString(16)
    )
  );
}
function getFirstException(event) {
  var _a, _b;
  return (_b = (_a = event.exception) == null ? void 0 : _a.values) == null ? void 0 : _b[0];
}
function getEventDescription(event) {
  const { message, event_id: eventId } = event;
  if (message) {
    return message;
  }
  const firstException = getFirstException(event);
  if (firstException) {
    if (firstException.type && firstException.value) {
      return `${firstException.type}: ${firstException.value}`;
    }
    return firstException.type || firstException.value || eventId || "<unknown>";
  }
  return eventId || "<unknown>";
}
function addExceptionTypeValue(event, value, type) {
  const exception = event.exception = event.exception || {};
  const values = exception.values = exception.values || [];
  const firstException = values[0] = values[0] || {};
  if (!firstException.value) {
    firstException.value = value || "";
  }
  if (!firstException.type) {
    firstException.type = "Error";
  }
}
function addExceptionMechanism(event, newMechanism) {
  const firstException = getFirstException(event);
  if (!firstException) {
    return;
  }
  const defaultMechanism = { type: "generic", handled: true };
  const currentMechanism = firstException.mechanism;
  firstException.mechanism = { ...defaultMechanism, ...currentMechanism, ...newMechanism };
  if (newMechanism && "data" in newMechanism) {
    const mergedData = { ...currentMechanism == null ? void 0 : currentMechanism.data, ...newMechanism.data };
    firstException.mechanism.data = mergedData;
  }
}
function checkOrSetAlreadyCaught(exception) {
  if (isAlreadyCaptured(exception)) {
    return true;
  }
  try {
    addNonEnumerableProperty(exception, "__sentry_captured__", true);
  } catch {
  }
  return false;
}
function isAlreadyCaptured(exception) {
  try {
    return exception.__sentry_captured__;
  } catch {
  }
}
const ONE_SECOND_IN_MS = 1e3;
function dateTimestampInSeconds() {
  return safeDateNow() / ONE_SECOND_IN_MS;
}
function createUnixTimestampInSecondsFunc() {
  const { performance: performance2 } = GLOBAL_OBJ;
  if (!(performance2 == null ? void 0 : performance2.now) || !performance2.timeOrigin) {
    return dateTimestampInSeconds;
  }
  const timeOrigin = performance2.timeOrigin;
  return () => {
    return (timeOrigin + withRandomSafeContext(() => performance2.now())) / ONE_SECOND_IN_MS;
  };
}
let _cachedTimestampInSeconds;
function timestampInSeconds() {
  const func = _cachedTimestampInSeconds ?? (_cachedTimestampInSeconds = createUnixTimestampInSecondsFunc());
  return func();
}
function makeSession(context) {
  const startingTime = timestampInSeconds();
  const session = {
    sid: uuid4(),
    init: true,
    timestamp: startingTime,
    started: startingTime,
    duration: 0,
    status: "ok",
    errors: 0,
    ignoreDuration: false,
    toJSON: () => sessionToJSON(session)
  };
  if (context) {
    updateSession(session, context);
  }
  return session;
}
function updateSession(session, context = {}) {
  if (context.user) {
    if (!session.ipAddress && context.user.ip_address) {
      session.ipAddress = context.user.ip_address;
    }
    if (!session.did && !context.did) {
      session.did = context.user.id || context.user.email || context.user.username;
    }
  }
  session.timestamp = context.timestamp || timestampInSeconds();
  if (context.abnormal_mechanism) {
    session.abnormal_mechanism = context.abnormal_mechanism;
  }
  if (context.ignoreDuration) {
    session.ignoreDuration = context.ignoreDuration;
  }
  if (context.sid) {
    session.sid = context.sid.length === 32 ? context.sid : uuid4();
  }
  if (context.init !== void 0) {
    session.init = context.init;
  }
  if (!session.did && context.did) {
    session.did = `${context.did}`;
  }
  if (typeof context.started === "number") {
    session.started = context.started;
  }
  if (session.ignoreDuration) {
    session.duration = void 0;
  } else if (typeof context.duration === "number") {
    session.duration = context.duration;
  } else {
    const duration = session.timestamp - session.started;
    session.duration = duration >= 0 ? duration : 0;
  }
  if (context.release) {
    session.release = context.release;
  }
  if (context.environment) {
    session.environment = context.environment;
  }
  if (!session.ipAddress && context.ipAddress) {
    session.ipAddress = context.ipAddress;
  }
  if (!session.userAgent && context.userAgent) {
    session.userAgent = context.userAgent;
  }
  if (typeof context.errors === "number") {
    session.errors = context.errors;
  }
  if (context.status) {
    session.status = context.status;
  }
}
function closeSession(session, status) {
  let context = {};
  if (session.status === "ok") {
    context = { status: "exited" };
  }
  updateSession(session, context);
}
function sessionToJSON(session) {
  return {
    sid: `${session.sid}`,
    init: session.init,
    // Make sure that sec is converted to ms for date constructor
    started: new Date(session.started * 1e3).toISOString(),
    timestamp: new Date(session.timestamp * 1e3).toISOString(),
    status: session.status,
    errors: session.errors,
    did: typeof session.did === "number" || typeof session.did === "string" ? `${session.did}` : void 0,
    duration: session.duration,
    abnormal_mechanism: session.abnormal_mechanism,
    attrs: {
      release: session.release,
      environment: session.environment,
      ip_address: session.ipAddress,
      user_agent: session.userAgent
    }
  };
}
function merge(initialObj, mergeObj, levels = 2) {
  if (!mergeObj || typeof mergeObj !== "object" || levels <= 0) {
    return mergeObj;
  }
  if (initialObj && Object.keys(mergeObj).length === 0) {
    return initialObj;
  }
  const output = { ...initialObj };
  for (const key in mergeObj) {
    if (Object.prototype.hasOwnProperty.call(mergeObj, key)) {
      output[key] = merge(output[key], mergeObj[key], levels - 1);
    }
  }
  return output;
}
function generateTraceId() {
  return uuid4();
}
function generateSpanId() {
  return uuid4().substring(16);
}
const SCOPE_SPAN_FIELD = "_sentrySpan";
function _setSpanForScope(scope2, span) {
  if (span) {
    addNonEnumerableProperty(scope2, SCOPE_SPAN_FIELD, span);
  } else {
    delete scope2[SCOPE_SPAN_FIELD];
  }
}
function _getSpanForScope(scope2) {
  return scope2[SCOPE_SPAN_FIELD];
}
const DEFAULT_MAX_BREADCRUMBS = 100;
class Scope {
  /** Flag if notifying is happening. */
  /** Callback for client to receive scope changes. */
  /** Callback list that will be called during event processing. */
  /** Array of breadcrumbs. */
  /** User */
  /** Tags */
  /** Attributes */
  /** Extra */
  /** Contexts */
  /** Attachments */
  /** Propagation Context for distributed tracing */
  /**
   * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
   * sent to Sentry
   */
  /** Fingerprint */
  /** Severity */
  /**
   * Transaction Name
   *
   * IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
   * It's purpose is to assign a transaction to the scope that's added to non-transaction events.
   */
  /** Session */
  /** The client on this scope */
  /** Contains the last event id of a captured event.  */
  /** Conversation ID */
  // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.
  constructor() {
    this._notifyingListeners = false;
    this._scopeListeners = [];
    this._eventProcessors = [];
    this._breadcrumbs = [];
    this._attachments = [];
    this._user = {};
    this._tags = {};
    this._attributes = {};
    this._extra = {};
    this._contexts = {};
    this._sdkProcessingMetadata = {};
    this._propagationContext = {
      traceId: generateTraceId(),
      sampleRand: safeMathRandom()
    };
  }
  /**
   * Clone all data from this scope into a new scope.
   */
  clone() {
    const newScope = new Scope();
    newScope._breadcrumbs = [...this._breadcrumbs];
    newScope._tags = { ...this._tags };
    newScope._attributes = { ...this._attributes };
    newScope._extra = { ...this._extra };
    newScope._contexts = { ...this._contexts };
    if (this._contexts.flags) {
      newScope._contexts.flags = {
        values: [...this._contexts.flags.values]
      };
    }
    newScope._user = this._user;
    newScope._level = this._level;
    newScope._session = this._session;
    newScope._transactionName = this._transactionName;
    newScope._fingerprint = this._fingerprint;
    newScope._eventProcessors = [...this._eventProcessors];
    newScope._attachments = [...this._attachments];
    newScope._sdkProcessingMetadata = { ...this._sdkProcessingMetadata };
    newScope._propagationContext = { ...this._propagationContext };
    newScope._client = this._client;
    newScope._lastEventId = this._lastEventId;
    newScope._conversationId = this._conversationId;
    _setSpanForScope(newScope, _getSpanForScope(this));
    return newScope;
  }
  /**
   * Update the client assigned to this scope.
   * Note that not every scope will have a client assigned - isolation scopes & the global scope will generally not have a client,
   * as well as manually created scopes.
   */
  setClient(client2) {
    this._client = client2;
  }
  /**
   * Set the ID of the last captured error event.
   * This is generally only captured on the isolation scope.
   */
  setLastEventId(lastEventId) {
    this._lastEventId = lastEventId;
  }
  /**
   * Get the client assigned to this scope.
   */
  getClient() {
    return this._client;
  }
  /**
   * Get the ID of the last captured error event.
   * This is generally only available on the isolation scope.
   */
  lastEventId() {
    return this._lastEventId;
  }
  /**
   * @inheritDoc
   */
  addScopeListener(callback) {
    this._scopeListeners.push(callback);
  }
  /**
   * Add an event processor that will be called before an event is sent.
   */
  addEventProcessor(callback) {
    this._eventProcessors.push(callback);
    return this;
  }
  /**
   * Set the user for this scope.
   * Set to `null` to unset the user.
   */
  setUser(user) {
    this._user = user || {
      email: void 0,
      id: void 0,
      ip_address: void 0,
      username: void 0
    };
    if (this._session) {
      updateSession(this._session, { user });
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Get the user from this scope.
   */
  getUser() {
    return this._user;
  }
  /**
   * Set the conversation ID for this scope.
   * Set to `null` to unset the conversation ID.
   */
  setConversationId(conversationId) {
    this._conversationId = conversationId || void 0;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Set an object that will be merged into existing tags on the scope,
   * and will be sent as tags data with the event.
   */
  setTags(tags) {
    this._tags = {
      ...this._tags,
      ...tags
    };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Set a single tag that will be sent as tags data with the event.
   */
  setTag(key, value) {
    return this.setTags({ [key]: value });
  }
  /**
   * Sets attributes onto the scope.
   *
   * These attributes are currently applied to logs and metrics.
   * In the future, they will also be applied to spans.
   *
   * Important: For now, only strings, numbers and boolean attributes are supported, despite types allowing for
   * more complex attribute types. We'll add this support in the future but already specify the wider type to
   * avoid a breaking change in the future.
   *
   * @param newAttributes - The attributes to set on the scope. You can either pass in key-value pairs, or
   * an object with a `value` and an optional `unit` (if applicable to your attribute).
   *
   * @example
   * ```typescript
   * scope.setAttributes({
   *   is_admin: true,
   *   payment_selection: 'credit_card',
   *   render_duration: { value: 'render_duration', unit: 'ms' },
   * });
   * ```
   */
  setAttributes(newAttributes) {
    this._attributes = {
      ...this._attributes,
      ...newAttributes
    };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets an attribute onto the scope.
   *
   * These attributes are currently applied to logs and metrics.
   * In the future, they will also be applied to spans.
   *
   * Important: For now, only strings, numbers and boolean attributes are supported, despite types allowing for
   * more complex attribute types. We'll add this support in the future but already specify the wider type to
   * avoid a breaking change in the future.
   *
   * @param key - The attribute key.
   * @param value - the attribute value. You can either pass in a raw value, or an attribute
   * object with a `value` and an optional `unit` (if applicable to your attribute).
   *
   * @example
   * ```typescript
   * scope.setAttribute('is_admin', true);
   * scope.setAttribute('render_duration', { value: 'render_duration', unit: 'ms' });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAttribute(key, value) {
    return this.setAttributes({ [key]: value });
  }
  /**
   * Removes the attribute with the given key from the scope.
   *
   * @param key - The attribute key.
   *
   * @example
   * ```typescript
   * scope.removeAttribute('is_admin');
   * ```
   */
  removeAttribute(key) {
    if (key in this._attributes) {
      delete this._attributes[key];
      this._notifyScopeListeners();
    }
    return this;
  }
  /**
   * Set an object that will be merged into existing extra on the scope,
   * and will be sent as extra data with the event.
   */
  setExtras(extras) {
    this._extra = {
      ...this._extra,
      ...extras
    };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Set a single key:value extra entry that will be sent as extra data with the event.
   */
  setExtra(key, extra) {
    this._extra = { ...this._extra, [key]: extra };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets the fingerprint on the scope to send with the events.
   * @param {string[]} fingerprint Fingerprint to group events in Sentry.
   */
  setFingerprint(fingerprint) {
    this._fingerprint = fingerprint;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets the level on the scope for future events.
   */
  setLevel(level) {
    this._level = level;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets the transaction name on the scope so that the name of e.g. taken server route or
   * the page location is attached to future events.
   *
   * IMPORTANT: Calling this function does NOT change the name of the currently active
   * root span. If you want to change the name of the active root span, use
   * `Sentry.updateSpanName(rootSpan, 'new name')` instead.
   *
   * By default, the SDK updates the scope's transaction name automatically on sensible
   * occasions, such as a page navigation or when handling a new request on the server.
   */
  setTransactionName(name) {
    this._transactionName = name;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets context data with the given name.
   * Data passed as context will be normalized. You can also pass `null` to unset the context.
   * Note that context data will not be merged - calling `setContext` will overwrite an existing context with the same key.
   */
  setContext(key, context) {
    if (context === null) {
      delete this._contexts[key];
    } else {
      this._contexts[key] = context;
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Set the session for the scope.
   */
  setSession(session) {
    if (!session) {
      delete this._session;
    } else {
      this._session = session;
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Get the session from the scope.
   */
  getSession() {
    return this._session;
  }
  /**
   * Updates the scope with provided data. Can work in three variations:
   * - plain object containing updatable attributes
   * - Scope instance that'll extract the attributes from
   * - callback function that'll receive the current scope as an argument and allow for modifications
   */
  update(captureContext) {
    if (!captureContext) {
      return this;
    }
    const scopeToMerge = typeof captureContext === "function" ? captureContext(this) : captureContext;
    const scopeInstance = scopeToMerge instanceof Scope ? scopeToMerge.getScopeData() : isPlainObject(scopeToMerge) ? captureContext : void 0;
    const {
      tags,
      attributes,
      extra,
      user,
      contexts,
      level,
      fingerprint = [],
      propagationContext,
      conversationId
    } = scopeInstance || {};
    this._tags = { ...this._tags, ...tags };
    this._attributes = { ...this._attributes, ...attributes };
    this._extra = { ...this._extra, ...extra };
    this._contexts = { ...this._contexts, ...contexts };
    if (user && Object.keys(user).length) {
      this._user = user;
    }
    if (level) {
      this._level = level;
    }
    if (fingerprint.length) {
      this._fingerprint = fingerprint;
    }
    if (propagationContext) {
      this._propagationContext = propagationContext;
    }
    if (conversationId) {
      this._conversationId = conversationId;
    }
    return this;
  }
  /**
   * Clears the current scope and resets its properties.
   * Note: The client will not be cleared.
   */
  clear() {
    this._breadcrumbs = [];
    this._tags = {};
    this._attributes = {};
    this._extra = {};
    this._user = {};
    this._contexts = {};
    this._level = void 0;
    this._transactionName = void 0;
    this._fingerprint = void 0;
    this._session = void 0;
    this._conversationId = void 0;
    _setSpanForScope(this, void 0);
    this._attachments = [];
    this.setPropagationContext({
      traceId: generateTraceId(),
      sampleRand: safeMathRandom()
    });
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Adds a breadcrumb to the scope.
   * By default, the last 100 breadcrumbs are kept.
   */
  addBreadcrumb(breadcrumb, maxBreadcrumbs) {
    var _a;
    const maxCrumbs = typeof maxBreadcrumbs === "number" ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
    if (maxCrumbs <= 0) {
      return this;
    }
    const mergedBreadcrumb = {
      timestamp: dateTimestampInSeconds(),
      ...breadcrumb,
      // Breadcrumb messages can theoretically be infinitely large and they're held in memory so we truncate them not to leak (too much) memory
      message: breadcrumb.message ? truncate(breadcrumb.message, 2048) : breadcrumb.message
    };
    this._breadcrumbs.push(mergedBreadcrumb);
    if (this._breadcrumbs.length > maxCrumbs) {
      this._breadcrumbs = this._breadcrumbs.slice(-maxCrumbs);
      (_a = this._client) == null ? void 0 : _a.recordDroppedEvent("buffer_overflow", "log_item");
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Get the last breadcrumb of the scope.
   */
  getLastBreadcrumb() {
    return this._breadcrumbs[this._breadcrumbs.length - 1];
  }
  /**
   * Clear all breadcrumbs from the scope.
   */
  clearBreadcrumbs() {
    this._breadcrumbs = [];
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Add an attachment to the scope.
   */
  addAttachment(attachment) {
    this._attachments.push(attachment);
    return this;
  }
  /**
   * Clear all attachments from the scope.
   */
  clearAttachments() {
    this._attachments = [];
    return this;
  }
  /**
   * Get the data of this scope, which should be applied to an event during processing.
   */
  getScopeData() {
    return {
      breadcrumbs: this._breadcrumbs,
      attachments: this._attachments,
      contexts: this._contexts,
      tags: this._tags,
      attributes: this._attributes,
      extra: this._extra,
      user: this._user,
      level: this._level,
      fingerprint: this._fingerprint || [],
      eventProcessors: this._eventProcessors,
      propagationContext: this._propagationContext,
      sdkProcessingMetadata: this._sdkProcessingMetadata,
      transactionName: this._transactionName,
      span: _getSpanForScope(this),
      conversationId: this._conversationId
    };
  }
  /**
   * Add data which will be accessible during event processing but won't get sent to Sentry.
   */
  setSDKProcessingMetadata(newData) {
    this._sdkProcessingMetadata = merge(this._sdkProcessingMetadata, newData, 2);
    return this;
  }
  /**
   * Add propagation context to the scope, used for distributed tracing
   */
  setPropagationContext(context) {
    this._propagationContext = context;
    return this;
  }
  /**
   * Get propagation context from the scope, used for distributed tracing
   */
  getPropagationContext() {
    return this._propagationContext;
  }
  /**
   * Capture an exception for this scope.
   *
   * @returns {string} The id of the captured Sentry event.
   */
  captureException(exception, hint) {
    const eventId = (hint == null ? void 0 : hint.event_id) || uuid4();
    if (!this._client) {
      DEBUG_BUILD$2 && debug.warn("No client configured on scope - will not capture exception!");
      return eventId;
    }
    const syntheticException = new Error("Sentry syntheticException");
    this._client.captureException(
      exception,
      {
        originalException: exception,
        syntheticException,
        ...hint,
        event_id: eventId
      },
      this
    );
    return eventId;
  }
  /**
   * Capture a message for this scope.
   *
   * @returns {string} The id of the captured message.
   */
  captureMessage(message, level, hint) {
    const eventId = (hint == null ? void 0 : hint.event_id) || uuid4();
    if (!this._client) {
      DEBUG_BUILD$2 && debug.warn("No client configured on scope - will not capture message!");
      return eventId;
    }
    const syntheticException = (hint == null ? void 0 : hint.syntheticException) ?? new Error(message);
    this._client.captureMessage(
      message,
      level,
      {
        originalException: message,
        syntheticException,
        ...hint,
        event_id: eventId
      },
      this
    );
    return eventId;
  }
  /**
   * Capture a Sentry event for this scope.
   *
   * @returns {string} The id of the captured event.
   */
  captureEvent(event, hint) {
    const eventId = event.event_id || (hint == null ? void 0 : hint.event_id) || uuid4();
    if (!this._client) {
      DEBUG_BUILD$2 && debug.warn("No client configured on scope - will not capture event!");
      return eventId;
    }
    this._client.captureEvent(event, { ...hint, event_id: eventId }, this);
    return eventId;
  }
  /**
   * This will be called on every set call.
   */
  _notifyScopeListeners() {
    if (!this._notifyingListeners) {
      this._notifyingListeners = true;
      this._scopeListeners.forEach((callback) => {
        callback(this);
      });
      this._notifyingListeners = false;
    }
  }
}
function getDefaultCurrentScope() {
  return getGlobalSingleton("defaultCurrentScope", () => new Scope());
}
function getDefaultIsolationScope() {
  return getGlobalSingleton("defaultIsolationScope", () => new Scope());
}
const isActualPromise = (p2) => p2 instanceof Promise && !p2[kChainedCopy];
const kChainedCopy = Symbol("chained PromiseLike");
const chainAndCopyPromiseLike = (original, onSuccess, onError) => {
  const chained = original.then(
    (value) => {
      onSuccess(value);
      return value;
    },
    (err) => {
      onError(err);
      throw err;
    }
  );
  return isActualPromise(chained) && isActualPromise(original) ? chained : copyProps(original, chained);
};
const copyProps = (original, chained) => {
  let mutated = false;
  for (const key in original) {
    if (key in chained) continue;
    mutated = true;
    const value = original[key];
    if (typeof value === "function") {
      Object.defineProperty(chained, key, {
        value: (...args) => value.apply(original, args),
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      chained[key] = value;
    }
  }
  if (mutated) Object.assign(chained, { [kChainedCopy]: true });
  return chained;
};
class AsyncContextStack {
  constructor(scope2, isolationScope) {
    let assignedScope;
    if (!scope2) {
      assignedScope = new Scope();
    } else {
      assignedScope = scope2;
    }
    let assignedIsolationScope;
    if (!isolationScope) {
      assignedIsolationScope = new Scope();
    } else {
      assignedIsolationScope = isolationScope;
    }
    this._stack = [{ scope: assignedScope }];
    this._isolationScope = assignedIsolationScope;
  }
  /**
   * Fork a scope for the stack.
   */
  withScope(callback) {
    const scope2 = this._pushScope();
    let maybePromiseResult;
    try {
      maybePromiseResult = callback(scope2);
    } catch (e) {
      this._popScope();
      throw e;
    }
    if (isThenable(maybePromiseResult)) {
      return chainAndCopyPromiseLike(
        maybePromiseResult,
        () => this._popScope(),
        () => this._popScope()
      );
    }
    this._popScope();
    return maybePromiseResult;
  }
  /**
   * Get the client of the stack.
   */
  getClient() {
    return this.getStackTop().client;
  }
  /**
   * Returns the scope of the top stack.
   */
  getScope() {
    return this.getStackTop().scope;
  }
  /**
   * Get the isolation scope for the stack.
   */
  getIsolationScope() {
    return this._isolationScope;
  }
  /**
   * Returns the topmost scope layer in the order domain > local > process.
   */
  getStackTop() {
    return this._stack[this._stack.length - 1];
  }
  /**
   * Push a scope to the stack.
   */
  _pushScope() {
    const scope2 = this.getScope().clone();
    this._stack.push({
      client: this.getClient(),
      scope: scope2
    });
    return scope2;
  }
  /**
   * Pop a scope from the stack.
   */
  _popScope() {
    if (this._stack.length <= 1) return false;
    return !!this._stack.pop();
  }
}
function getAsyncContextStack() {
  const registry = getMainCarrier();
  const sentry = getSentryCarrier(registry);
  return sentry.stack = sentry.stack || new AsyncContextStack(getDefaultCurrentScope(), getDefaultIsolationScope());
}
function withScope$1(callback) {
  return getAsyncContextStack().withScope(callback);
}
function withSetScope(scope2, callback) {
  const stack = getAsyncContextStack();
  return stack.withScope(() => {
    stack.getStackTop().scope = scope2;
    return callback(scope2);
  });
}
function withIsolationScope(callback) {
  return getAsyncContextStack().withScope(() => {
    return callback(getAsyncContextStack().getIsolationScope());
  });
}
function getStackAsyncContextStrategy() {
  return {
    withIsolationScope,
    withScope: withScope$1,
    withSetScope,
    withSetIsolationScope: (_isolationScope, callback) => {
      return withIsolationScope(callback);
    },
    getCurrentScope: () => getAsyncContextStack().getScope(),
    getIsolationScope: () => getAsyncContextStack().getIsolationScope()
  };
}
function getAsyncContextStrategy(carrier) {
  const sentry = getSentryCarrier(carrier);
  if (sentry.acs) {
    return sentry.acs;
  }
  return getStackAsyncContextStrategy();
}
function getCurrentScope() {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  return acs.getCurrentScope();
}
function getIsolationScope() {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  return acs.getIsolationScope();
}
function getGlobalScope() {
  return getGlobalSingleton("globalScope", () => new Scope());
}
function withScope(...rest) {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  if (rest.length === 2) {
    const [scope2, callback] = rest;
    if (!scope2) {
      return acs.withScope(callback);
    }
    return acs.withSetScope(scope2, callback);
  }
  return acs.withScope(rest[0]);
}
function getClient() {
  return getCurrentScope().getClient();
}
function getTraceContextFromScope(scope2) {
  const propagationContext = scope2.getPropagationContext();
  const { traceId, parentSpanId, propagationSpanId } = propagationContext;
  const traceContext = {
    trace_id: traceId,
    span_id: propagationSpanId || generateSpanId()
  };
  if (parentSpanId) {
    traceContext.parent_span_id = parentSpanId;
  }
  return traceContext;
}
const SEMANTIC_ATTRIBUTE_SENTRY_SOURCE = "sentry.source";
const SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = "sentry.sample_rate";
const SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE = "sentry.previous_trace_sample_rate";
const SEMANTIC_ATTRIBUTE_SENTRY_OP = "sentry.op";
const SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = "sentry.origin";
const SEMANTIC_ATTRIBUTE_PROFILE_ID = "sentry.profile_id";
const SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = "sentry.exclusive_time";
const GEN_AI_CONVERSATION_ID_ATTRIBUTE = "gen_ai.conversation.id";
const SPAN_STATUS_UNSET = 0;
const SPAN_STATUS_OK = 1;
const SCOPE_ON_START_SPAN_FIELD = "_sentryScope";
const ISOLATION_SCOPE_ON_START_SPAN_FIELD = "_sentryIsolationScope";
function unwrapScopeFromWeakRef(scopeRef) {
  if (!scopeRef) {
    return void 0;
  }
  if (typeof scopeRef === "object" && "deref" in scopeRef && typeof scopeRef.deref === "function") {
    try {
      return scopeRef.deref();
    } catch {
      return void 0;
    }
  }
  return scopeRef;
}
function getCapturedScopesOnSpan(span) {
  const spanWithScopes = span;
  return {
    scope: spanWithScopes[SCOPE_ON_START_SPAN_FIELD],
    isolationScope: unwrapScopeFromWeakRef(spanWithScopes[ISOLATION_SCOPE_ON_START_SPAN_FIELD])
  };
}
const SENTRY_BAGGAGE_KEY_PREFIX = "sentry-";
function baggageHeaderToDynamicSamplingContext(baggageHeader) {
  const baggageObject = parseBaggageHeader(baggageHeader);
  if (!baggageObject) {
    return void 0;
  }
  const dynamicSamplingContext = Object.entries(baggageObject).reduce((acc, [key, value]) => {
    if (key.startsWith(SENTRY_BAGGAGE_KEY_PREFIX)) {
      const nonPrefixedKey = key.slice(SENTRY_BAGGAGE_KEY_PREFIX.length);
      acc[nonPrefixedKey] = value;
    }
    return acc;
  }, {});
  if (Object.keys(dynamicSamplingContext).length > 0) {
    return dynamicSamplingContext;
  } else {
    return void 0;
  }
}
function parseBaggageHeader(baggageHeader) {
  if (!baggageHeader || !isString(baggageHeader) && !Array.isArray(baggageHeader)) {
    return void 0;
  }
  if (Array.isArray(baggageHeader)) {
    return baggageHeader.reduce((acc, curr) => {
      const currBaggageObject = baggageHeaderToObject(curr);
      Object.entries(currBaggageObject).forEach(([key, value]) => {
        acc[key] = value;
      });
      return acc;
    }, {});
  }
  return baggageHeaderToObject(baggageHeader);
}
function baggageHeaderToObject(baggageHeader) {
  return baggageHeader.split(",").map((baggageEntry) => {
    const eqIdx = baggageEntry.indexOf("=");
    if (eqIdx === -1) {
      return [];
    }
    const key = baggageEntry.slice(0, eqIdx);
    const value = baggageEntry.slice(eqIdx + 1);
    return [key, value].map((keyOrValue) => {
      try {
        return decodeURIComponent(keyOrValue.trim());
      } catch {
        return;
      }
    });
  }).reduce((acc, [key, value]) => {
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
const ORG_ID_REGEX = /^o(\d+)\./;
const DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)((?:\[[:.%\w]+\]|[\w.-]+))(?::(\d+))?\/(.+)/;
function isValidProtocol(protocol) {
  return protocol === "http" || protocol === "https";
}
function dsnToString(dsn, withPassword = false) {
  const { host, path, pass, port, projectId, protocol, publicKey } = dsn;
  return `${protocol}://${publicKey}${withPassword && pass ? `:${pass}` : ""}@${host}${port ? `:${port}` : ""}/${path ? `${path}/` : path}${projectId}`;
}
function dsnFromString(str) {
  const match = DSN_REGEX.exec(str);
  if (!match) {
    consoleSandbox(() => {
      console.error(`Invalid Sentry Dsn: ${str}`);
    });
    return void 0;
  }
  const [protocol, publicKey, pass = "", host = "", port = "", lastPath = ""] = match.slice(1);
  let path = "";
  let projectId = lastPath;
  const split = projectId.split("/");
  if (split.length > 1) {
    path = split.slice(0, -1).join("/");
    projectId = split.pop();
  }
  if (projectId) {
    const projectMatch = projectId.match(/^\d+/);
    if (projectMatch) {
      projectId = projectMatch[0];
    }
  }
  return dsnFromComponents({ host, pass, path, projectId, port, protocol, publicKey });
}
function dsnFromComponents(components) {
  return {
    protocol: components.protocol,
    publicKey: components.publicKey || "",
    pass: components.pass || "",
    host: components.host,
    port: components.port || "",
    path: components.path || "",
    projectId: components.projectId
  };
}
function validateDsn(dsn) {
  if (!DEBUG_BUILD$2) {
    return true;
  }
  const { port, projectId, protocol } = dsn;
  const requiredComponents = ["protocol", "publicKey", "host", "projectId"];
  const hasMissingRequiredComponent = requiredComponents.find((component) => {
    if (!dsn[component]) {
      debug.error(`Invalid Sentry Dsn: ${component} missing`);
      return true;
    }
    return false;
  });
  if (hasMissingRequiredComponent) {
    return false;
  }
  if (!projectId.match(/^\d+$/)) {
    debug.error(`Invalid Sentry Dsn: Invalid projectId ${projectId}`);
    return false;
  }
  if (!isValidProtocol(protocol)) {
    debug.error(`Invalid Sentry Dsn: Invalid protocol ${protocol}`);
    return false;
  }
  if (port && isNaN(parseInt(port, 10))) {
    debug.error(`Invalid Sentry Dsn: Invalid port ${port}`);
    return false;
  }
  return true;
}
function extractOrgIdFromDsnHost(host) {
  const match = host.match(ORG_ID_REGEX);
  return match == null ? void 0 : match[1];
}
function extractOrgIdFromClient(client2) {
  const options = client2.getOptions();
  const { host } = client2.getDsn() || {};
  let org_id;
  if (options.orgId) {
    org_id = String(options.orgId);
  } else if (host) {
    org_id = extractOrgIdFromDsnHost(host);
  }
  return org_id;
}
function makeDsn(from) {
  const components = typeof from === "string" ? dsnFromString(from) : dsnFromComponents(from);
  if (!components || !validateDsn(components)) {
    return void 0;
  }
  return components;
}
function parseSampleRate(sampleRate) {
  if (typeof sampleRate === "boolean") {
    return Number(sampleRate);
  }
  const rate = typeof sampleRate === "string" ? parseFloat(sampleRate) : sampleRate;
  if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > 1) {
    return void 0;
  }
  return rate;
}
const TRACE_FLAG_SAMPLED = 1;
let hasShownSpanDropWarning = false;
function spanToTraceContext(span) {
  const { spanId, traceId: trace_id, isRemote } = span.spanContext();
  const parent_span_id = isRemote ? spanId : spanToJSON(span).parent_span_id;
  const scope2 = getCapturedScopesOnSpan(span).scope;
  const span_id = isRemote ? (scope2 == null ? void 0 : scope2.getPropagationContext().propagationSpanId) || generateSpanId() : spanId;
  return {
    parent_span_id,
    span_id,
    trace_id
  };
}
function convertSpanLinksForEnvelope(links) {
  if (links && links.length > 0) {
    return links.map(({ context: { spanId, traceId, traceFlags, ...restContext }, attributes }) => ({
      span_id: spanId,
      trace_id: traceId,
      sampled: traceFlags === TRACE_FLAG_SAMPLED,
      attributes,
      ...restContext
    }));
  } else {
    return void 0;
  }
}
function spanTimeInputToSeconds(input) {
  if (typeof input === "number") {
    return ensureTimestampInSeconds(input);
  }
  if (Array.isArray(input)) {
    return input[0] + input[1] / 1e9;
  }
  if (input instanceof Date) {
    return ensureTimestampInSeconds(input.getTime());
  }
  return timestampInSeconds();
}
function ensureTimestampInSeconds(timestamp) {
  const isMs = timestamp > 9999999999;
  return isMs ? timestamp / 1e3 : timestamp;
}
function spanToJSON(span) {
  if (spanIsSentrySpan(span)) {
    return span.getSpanJSON();
  }
  const { spanId: span_id, traceId: trace_id } = span.spanContext();
  if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
    const { attributes, startTime, name, endTime, status, links } = span;
    return {
      span_id,
      trace_id,
      data: attributes,
      description: name,
      parent_span_id: getOtelParentSpanId(span),
      start_timestamp: spanTimeInputToSeconds(startTime),
      // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
      timestamp: spanTimeInputToSeconds(endTime) || void 0,
      status: getStatusMessage(status),
      op: attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
      origin: attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
      links: convertSpanLinksForEnvelope(links)
    };
  }
  return {
    span_id,
    trace_id,
    start_timestamp: 0,
    data: {}
  };
}
function getOtelParentSpanId(span) {
  var _a;
  return "parentSpanId" in span ? span.parentSpanId : "parentSpanContext" in span ? (_a = span.parentSpanContext) == null ? void 0 : _a.spanId : void 0;
}
function spanIsOpenTelemetrySdkTraceBaseSpan(span) {
  const castSpan = span;
  return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
}
function spanIsSentrySpan(span) {
  return typeof span.getSpanJSON === "function";
}
function spanIsSampled(span) {
  const { traceFlags } = span.spanContext();
  return traceFlags === TRACE_FLAG_SAMPLED;
}
function getStatusMessage(status) {
  if (!status || status.code === SPAN_STATUS_UNSET) {
    return void 0;
  }
  if (status.code === SPAN_STATUS_OK) {
    return "ok";
  }
  return status.message || "internal_error";
}
const ROOT_SPAN_FIELD = "_sentryRootSpan";
const getRootSpan = INTERNAL_getSegmentSpan;
function INTERNAL_getSegmentSpan(span) {
  return span[ROOT_SPAN_FIELD] || span;
}
function showSpanDropWarning() {
  if (!hasShownSpanDropWarning) {
    consoleSandbox(() => {
      console.warn(
        "[Sentry] Returning null from `beforeSendSpan` is disallowed. To drop certain spans, configure the respective integrations directly or use `ignoreSpans`."
      );
    });
    hasShownSpanDropWarning = true;
  }
}
function hasSpansEnabled(maybeOptions) {
  var _a;
  if (typeof __SENTRY_TRACING__ === "boolean" && !__SENTRY_TRACING__) {
    return false;
  }
  const options = (_a = getClient()) == null ? void 0 : _a.getOptions();
  return !!options && // Note: This check is `!= null`, meaning "nullish". `0` is not "nullish", `undefined` and `null` are. (This comment was brought to you by 15 minutes of questioning life)
  (options.tracesSampleRate != null || !!options.tracesSampler);
}
function logIgnoredSpan(droppedSpan) {
  debug.log(`Ignoring span ${droppedSpan.op} - ${droppedSpan.description} because it matches \`ignoreSpans\`.`);
}
function shouldIgnoreSpan(span, ignoreSpans) {
  if (!(ignoreSpans == null ? void 0 : ignoreSpans.length) || !span.description) {
    return false;
  }
  for (const pattern of ignoreSpans) {
    if (isStringOrRegExp(pattern)) {
      if (isMatchingPattern(span.description, pattern)) {
        DEBUG_BUILD$2 && logIgnoredSpan(span);
        return true;
      }
      continue;
    }
    if (!pattern.name && !pattern.op) {
      continue;
    }
    const nameMatches = pattern.name ? isMatchingPattern(span.description, pattern.name) : true;
    const opMatches = pattern.op ? span.op && isMatchingPattern(span.op, pattern.op) : true;
    if (nameMatches && opMatches) {
      DEBUG_BUILD$2 && logIgnoredSpan(span);
      return true;
    }
  }
  return false;
}
function reparentChildSpans(spans, dropSpan) {
  const droppedSpanParentId = dropSpan.parent_span_id;
  const droppedSpanId = dropSpan.span_id;
  if (!droppedSpanParentId) {
    return;
  }
  for (const span of spans) {
    if (span.parent_span_id === droppedSpanId) {
      span.parent_span_id = droppedSpanParentId;
    }
  }
}
function isStringOrRegExp(value) {
  return typeof value === "string" || value instanceof RegExp;
}
const DEFAULT_ENVIRONMENT = "production";
const FROZEN_DSC_FIELD = "_frozenDsc";
function getDynamicSamplingContextFromClient(trace_id, client2) {
  const options = client2.getOptions();
  const { publicKey: public_key } = client2.getDsn() || {};
  const dsc = {
    environment: options.environment || DEFAULT_ENVIRONMENT,
    release: options.release,
    public_key,
    trace_id,
    org_id: extractOrgIdFromClient(client2)
  };
  client2.emit("createDsc", dsc);
  return dsc;
}
function getDynamicSamplingContextFromScope(client2, scope2) {
  const propagationContext = scope2.getPropagationContext();
  return propagationContext.dsc || getDynamicSamplingContextFromClient(propagationContext.traceId, client2);
}
function getDynamicSamplingContextFromSpan(span) {
  var _a;
  const client2 = getClient();
  if (!client2) {
    return {};
  }
  const rootSpan = getRootSpan(span);
  const rootSpanJson = spanToJSON(rootSpan);
  const rootSpanAttributes = rootSpanJson.data;
  const traceState = rootSpan.spanContext().traceState;
  const rootSpanSampleRate = (traceState == null ? void 0 : traceState.get("sentry.sample_rate")) ?? rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE] ?? rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE];
  function applyLocalSampleRateToDsc(dsc2) {
    if (typeof rootSpanSampleRate === "number" || typeof rootSpanSampleRate === "string") {
      dsc2.sample_rate = `${rootSpanSampleRate}`;
    }
    return dsc2;
  }
  const frozenDsc = rootSpan[FROZEN_DSC_FIELD];
  if (frozenDsc) {
    return applyLocalSampleRateToDsc(frozenDsc);
  }
  const traceStateDsc = traceState == null ? void 0 : traceState.get("sentry.dsc");
  const dscOnTraceState = traceStateDsc && baggageHeaderToDynamicSamplingContext(traceStateDsc);
  if (dscOnTraceState) {
    return applyLocalSampleRateToDsc(dscOnTraceState);
  }
  const dsc = getDynamicSamplingContextFromClient(span.spanContext().traceId, client2);
  const source = rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] ?? rootSpanAttributes["sentry.span.source"];
  const name = rootSpanJson.description;
  if (source !== "url" && name) {
    dsc.transaction = name;
  }
  if (hasSpansEnabled()) {
    dsc.sampled = String(spanIsSampled(rootSpan));
    dsc.sample_rand = // In OTEL we store the sample rand on the trace state because we cannot access scopes for NonRecordingSpans
    // The Sentry OTEL SpanSampler takes care of writing the sample rand on the root span
    (traceState == null ? void 0 : traceState.get("sentry.sample_rand")) ?? // On all other platforms we can actually get the scopes from a root span (we use this as a fallback)
    ((_a = getCapturedScopesOnSpan(rootSpan).scope) == null ? void 0 : _a.getPropagationContext().sampleRand.toString());
  }
  applyLocalSampleRateToDsc(dsc);
  client2.emit("createDsc", dsc, rootSpan);
  return dsc;
}
function isStreamedBeforeSendSpanCallback(callback) {
  return !!callback && typeof callback === "function" && "_streamed" in callback && !!callback._streamed;
}
function normalize(input, depth = 100, maxProperties = Infinity) {
  try {
    return visit("", input, depth, maxProperties);
  } catch (err) {
    return { ERROR: `**non-serializable** (${err})` };
  }
}
function normalizeToSize(object, depth = 3, maxSize = 100 * 1024) {
  const normalized = normalize(object, depth);
  if (jsonSize(normalized) > maxSize) {
    return normalizeToSize(object, depth - 1, maxSize);
  }
  return normalized;
}
function visit(key, value, depth = Infinity, maxProperties = Infinity, memo = memoBuilder()) {
  const [memoize, unmemoize] = memo;
  if (value == null || // this matches null and undefined -> eqeq not eqeqeq
  ["boolean", "string"].includes(typeof value) || typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const stringified = stringifyValue(key, value);
  if (!stringified.startsWith("[object ")) {
    return stringified;
  }
  if (value["__sentry_skip_normalization__"]) {
    return value;
  }
  const remainingDepth = typeof value["__sentry_override_normalization_depth__"] === "number" ? value["__sentry_override_normalization_depth__"] : depth;
  if (remainingDepth === 0) {
    return stringified.replace("object ", "");
  }
  if (memoize(value)) {
    return "[Circular ~]";
  }
  const valueWithToJSON = value;
  if (valueWithToJSON && typeof valueWithToJSON.toJSON === "function") {
    try {
      const jsonValue = valueWithToJSON.toJSON();
      return visit("", jsonValue, remainingDepth - 1, maxProperties, memo);
    } catch {
    }
  }
  const normalized = Array.isArray(value) ? [] : {};
  let numAdded = 0;
  const visitable = convertToPlainObject(value);
  for (const visitKey in visitable) {
    if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) {
      continue;
    }
    if (numAdded >= maxProperties) {
      normalized[visitKey] = "[MaxProperties ~]";
      break;
    }
    const visitValue = visitable[visitKey];
    normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo);
    numAdded++;
  }
  unmemoize(value);
  return normalized;
}
function stringifyValue(key, value) {
  try {
    if (key === "domain" && value && typeof value === "object" && value._events) {
      return "[Domain]";
    }
    if (key === "domainEmitter") {
      return "[DomainEmitter]";
    }
    if (typeof global !== "undefined" && value === global) {
      return "[Global]";
    }
    if (typeof window !== "undefined" && value === window) {
      return "[Window]";
    }
    if (typeof document !== "undefined" && value === document) {
      return "[Document]";
    }
    if (isVueViewModel(value)) {
      return getVueInternalName(value);
    }
    if (isSyntheticEvent(value)) {
      return "[SyntheticEvent]";
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      return `[${value}]`;
    }
    if (typeof value === "function") {
      return `[Function: ${getFunctionName(value)}]`;
    }
    if (typeof value === "symbol") {
      return `[${String(value)}]`;
    }
    if (typeof value === "bigint") {
      return `[BigInt: ${String(value)}]`;
    }
    const objName = getConstructorName(value);
    if (/^HTML(\w*)Element$/.test(objName)) {
      return `[HTMLElement: ${objName}]`;
    }
    return `[object ${objName}]`;
  } catch (err) {
    return `**non-serializable** (${err})`;
  }
}
function getConstructorName(value) {
  const prototype = Object.getPrototypeOf(value);
  return (prototype == null ? void 0 : prototype.constructor) ? prototype.constructor.name : "null prototype";
}
function utf8Length(value) {
  return ~-encodeURI(value).split(/%..|./).length;
}
function jsonSize(value) {
  return utf8Length(JSON.stringify(value));
}
function memoBuilder() {
  const inner = /* @__PURE__ */ new WeakSet();
  function memoize(obj) {
    if (inner.has(obj)) {
      return true;
    }
    inner.add(obj);
    return false;
  }
  function unmemoize(obj) {
    inner.delete(obj);
  }
  return [memoize, unmemoize];
}
function createEnvelope(headers, items = []) {
  return [headers, items];
}
function addItemToEnvelope(envelope, newItem) {
  const [headers, items] = envelope;
  return [headers, [...items, newItem]];
}
function forEachEnvelopeItem(envelope, callback) {
  const envelopeItems = envelope[1];
  for (const envelopeItem of envelopeItems) {
    const envelopeItemType = envelopeItem[0].type;
    const result = callback(envelopeItem, envelopeItemType);
    if (result) {
      return true;
    }
  }
  return false;
}
function envelopeContainsItemType(envelope, types) {
  return forEachEnvelopeItem(envelope, (_, type) => types.includes(type));
}
function encodeUTF8(input) {
  const carrier = getSentryCarrier(GLOBAL_OBJ);
  return carrier.encodePolyfill ? carrier.encodePolyfill(input) : new TextEncoder().encode(input);
}
function serializeEnvelope(envelope) {
  const [envHeaders, items] = envelope;
  let parts = JSON.stringify(envHeaders);
  function append(next) {
    if (typeof parts === "string") {
      parts = typeof next === "string" ? parts + next : [encodeUTF8(parts), next];
    } else {
      parts.push(typeof next === "string" ? encodeUTF8(next) : next);
    }
  }
  for (const item2 of items) {
    const [itemHeaders, payload] = item2;
    append(`
${JSON.stringify(itemHeaders)}
`);
    if (typeof payload === "string" || payload instanceof Uint8Array) {
      append(payload);
    } else {
      let stringifiedPayload;
      try {
        stringifiedPayload = JSON.stringify(payload);
      } catch {
        stringifiedPayload = JSON.stringify(normalize(payload));
      }
      append(stringifiedPayload);
    }
  }
  return typeof parts === "string" ? parts : concatBuffers(parts);
}
function concatBuffers(buffers) {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    merged.set(buffer, offset);
    offset += buffer.length;
  }
  return merged;
}
function createAttachmentEnvelopeItem(attachment) {
  const buffer = typeof attachment.data === "string" ? encodeUTF8(attachment.data) : attachment.data;
  return [
    {
      type: "attachment",
      length: buffer.length,
      filename: attachment.filename,
      content_type: attachment.contentType,
      attachment_type: attachment.attachmentType
    },
    buffer
  ];
}
const DATA_CATEGORY_OVERRIDES = {
  sessions: "session",
  event: "error",
  client_report: "internal",
  user_report: "default",
  profile_chunk: "profile",
  replay_event: "replay",
  replay_recording: "replay",
  check_in: "monitor",
  raw_security: "security",
  log: "log_item",
  trace_metric: "metric"
};
function _isOverriddenType(type) {
  return type in DATA_CATEGORY_OVERRIDES;
}
function envelopeItemTypeToDataCategory(type) {
  return _isOverriddenType(type) ? DATA_CATEGORY_OVERRIDES[type] : type;
}
function getSdkMetadataForEnvelopeHeader(metadataOrEvent) {
  if (!(metadataOrEvent == null ? void 0 : metadataOrEvent.sdk)) {
    return;
  }
  const { name, version } = metadataOrEvent.sdk;
  return { name, version };
}
function createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn) {
  var _a;
  const dynamicSamplingContext = (_a = event.sdkProcessingMetadata) == null ? void 0 : _a.dynamicSamplingContext;
  return {
    event_id: event.event_id,
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...sdkInfo && { sdk: sdkInfo },
    ...!!tunnel && dsn && { dsn: dsnToString(dsn) },
    ...dynamicSamplingContext && {
      trace: dynamicSamplingContext
    }
  };
}
function _enhanceEventWithSdkInfo(event, newSdkInfo) {
  var _a, _b, _c, _d;
  if (!newSdkInfo) {
    return event;
  }
  const eventSdkInfo = event.sdk || {};
  event.sdk = {
    ...eventSdkInfo,
    name: eventSdkInfo.name || newSdkInfo.name,
    version: eventSdkInfo.version || newSdkInfo.version,
    integrations: [...((_a = event.sdk) == null ? void 0 : _a.integrations) || [], ...newSdkInfo.integrations || []],
    packages: [...((_b = event.sdk) == null ? void 0 : _b.packages) || [], ...newSdkInfo.packages || []],
    settings: ((_c = event.sdk) == null ? void 0 : _c.settings) || newSdkInfo.settings ? {
      ...(_d = event.sdk) == null ? void 0 : _d.settings,
      ...newSdkInfo.settings
    } : void 0
  };
  return event;
}
function createSessionEnvelope(session, dsn, metadata, tunnel) {
  const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
  const envelopeHeaders = {
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...sdkInfo && { sdk: sdkInfo },
    ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
  };
  const envelopeItem = "aggregates" in session ? [{ type: "sessions" }, session] : [{ type: "session" }, session.toJSON()];
  return createEnvelope(envelopeHeaders, [envelopeItem]);
}
function createEventEnvelope(event, dsn, metadata, tunnel) {
  const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
  const eventType = event.type && event.type !== "replay_event" ? event.type : "event";
  _enhanceEventWithSdkInfo(event, metadata == null ? void 0 : metadata.sdk);
  const envelopeHeaders = createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn);
  delete event.sdkProcessingMetadata;
  const eventItem = [{ type: eventType }, event];
  return createEnvelope(envelopeHeaders, [eventItem]);
}
function applyScopeDataToEvent(event, data) {
  const { fingerprint, span, breadcrumbs, sdkProcessingMetadata } = data;
  applyDataToEvent(event, data);
  if (span) {
    applySpanToEvent(event, span);
  }
  applyFingerprintToEvent(event, fingerprint);
  applyBreadcrumbsToEvent(event, breadcrumbs);
  applySdkMetadataToEvent(event, sdkProcessingMetadata);
}
function mergeScopeData(data, mergeData) {
  const {
    extra,
    tags,
    attributes,
    user,
    contexts,
    level,
    sdkProcessingMetadata,
    breadcrumbs,
    fingerprint,
    eventProcessors,
    attachments,
    propagationContext,
    transactionName,
    span
  } = mergeData;
  mergeAndOverwriteScopeData(data, "extra", extra);
  mergeAndOverwriteScopeData(data, "tags", tags);
  mergeAndOverwriteScopeData(data, "attributes", attributes);
  mergeAndOverwriteScopeData(data, "user", user);
  mergeAndOverwriteScopeData(data, "contexts", contexts);
  data.sdkProcessingMetadata = merge(data.sdkProcessingMetadata, sdkProcessingMetadata, 2);
  if (level) {
    data.level = level;
  }
  if (transactionName) {
    data.transactionName = transactionName;
  }
  if (span) {
    data.span = span;
  }
  if (breadcrumbs.length) {
    data.breadcrumbs = [...data.breadcrumbs, ...breadcrumbs];
  }
  if (fingerprint.length) {
    data.fingerprint = [...data.fingerprint, ...fingerprint];
  }
  if (eventProcessors.length) {
    data.eventProcessors = [...data.eventProcessors, ...eventProcessors];
  }
  if (attachments.length) {
    data.attachments = [...data.attachments, ...attachments];
  }
  data.propagationContext = { ...data.propagationContext, ...propagationContext };
}
function mergeAndOverwriteScopeData(data, prop, mergeVal) {
  data[prop] = merge(data[prop], mergeVal, 1);
}
function getCombinedScopeData(isolationScope, currentScope) {
  const scopeData = getGlobalScope().getScopeData();
  isolationScope && mergeScopeData(scopeData, isolationScope.getScopeData());
  currentScope && mergeScopeData(scopeData, currentScope.getScopeData());
  return scopeData;
}
function applyDataToEvent(event, data) {
  const { extra, tags, user, contexts, level, transactionName } = data;
  if (Object.keys(extra).length) {
    event.extra = { ...extra, ...event.extra };
  }
  if (Object.keys(tags).length) {
    event.tags = { ...tags, ...event.tags };
  }
  if (Object.keys(user).length) {
    event.user = { ...user, ...event.user };
  }
  if (Object.keys(contexts).length) {
    event.contexts = { ...contexts, ...event.contexts };
  }
  if (level) {
    event.level = level;
  }
  if (transactionName && event.type !== "transaction") {
    event.transaction = transactionName;
  }
}
function applyBreadcrumbsToEvent(event, breadcrumbs) {
  const mergedBreadcrumbs = [...event.breadcrumbs || [], ...breadcrumbs];
  event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : void 0;
}
function applySdkMetadataToEvent(event, sdkProcessingMetadata) {
  event.sdkProcessingMetadata = {
    ...event.sdkProcessingMetadata,
    ...sdkProcessingMetadata
  };
}
function applySpanToEvent(event, span) {
  event.contexts = {
    trace: spanToTraceContext(span),
    ...event.contexts
  };
  event.sdkProcessingMetadata = {
    dynamicSamplingContext: getDynamicSamplingContextFromSpan(span),
    ...event.sdkProcessingMetadata
  };
  const rootSpan = getRootSpan(span);
  const transactionName = spanToJSON(rootSpan).description;
  if (transactionName && !event.transaction && event.type === "transaction") {
    event.transaction = transactionName;
  }
}
function applyFingerprintToEvent(event, fingerprint) {
  event.fingerprint = event.fingerprint ? Array.isArray(event.fingerprint) ? event.fingerprint : [event.fingerprint] : [];
  if (fingerprint) {
    event.fingerprint = event.fingerprint.concat(fingerprint);
  }
  if (!event.fingerprint.length) {
    delete event.fingerprint;
  }
}
const STATE_PENDING = 0;
const STATE_RESOLVED = 1;
const STATE_REJECTED = 2;
function resolvedSyncPromise(value) {
  return new SyncPromise((resolve) => {
    resolve(value);
  });
}
function rejectedSyncPromise(reason) {
  return new SyncPromise((_, reject) => {
    reject(reason);
  });
}
class SyncPromise {
  constructor(executor) {
    this._state = STATE_PENDING;
    this._handlers = [];
    this._runExecutor(executor);
  }
  /** @inheritdoc */
  then(onfulfilled, onrejected) {
    return new SyncPromise((resolve, reject) => {
      this._handlers.push([
        false,
        (result) => {
          if (!onfulfilled) {
            resolve(result);
          } else {
            try {
              resolve(onfulfilled(result));
            } catch (e) {
              reject(e);
            }
          }
        },
        (reason) => {
          if (!onrejected) {
            reject(reason);
          } else {
            try {
              resolve(onrejected(reason));
            } catch (e) {
              reject(e);
            }
          }
        }
      ]);
      this._executeHandlers();
    });
  }
  /** @inheritdoc */
  catch(onrejected) {
    return this.then((val) => val, onrejected);
  }
  /** @inheritdoc */
  finally(onfinally) {
    return new SyncPromise((resolve, reject) => {
      let val;
      let isRejected;
      return this.then(
        (value) => {
          isRejected = false;
          val = value;
          if (onfinally) {
            onfinally();
          }
        },
        (reason) => {
          isRejected = true;
          val = reason;
          if (onfinally) {
            onfinally();
          }
        }
      ).then(() => {
        if (isRejected) {
          reject(val);
          return;
        }
        resolve(val);
      });
    });
  }
  /** Excute the resolve/reject handlers. */
  _executeHandlers() {
    if (this._state === STATE_PENDING) {
      return;
    }
    const cachedHandlers = this._handlers.slice();
    this._handlers = [];
    cachedHandlers.forEach((handler) => {
      if (handler[0]) {
        return;
      }
      if (this._state === STATE_RESOLVED) {
        handler[1](this._value);
      }
      if (this._state === STATE_REJECTED) {
        handler[2](this._value);
      }
      handler[0] = true;
    });
  }
  /** Run the executor for the SyncPromise. */
  _runExecutor(executor) {
    const setResult = (state, value) => {
      if (this._state !== STATE_PENDING) {
        return;
      }
      if (isThenable(value)) {
        void value.then(resolve, reject);
        return;
      }
      this._state = state;
      this._value = value;
      this._executeHandlers();
    };
    const resolve = (value) => {
      setResult(STATE_RESOLVED, value);
    };
    const reject = (reason) => {
      setResult(STATE_REJECTED, reason);
    };
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
}
function notifyEventProcessors(processors, event, hint, index = 0) {
  try {
    const result = _notifyEventProcessors(event, hint, processors, index);
    return isThenable(result) ? result : resolvedSyncPromise(result);
  } catch (error2) {
    return rejectedSyncPromise(error2);
  }
}
function _notifyEventProcessors(event, hint, processors, index) {
  const processor = processors[index];
  if (!event || !processor) {
    return event;
  }
  const result = processor({ ...event }, hint);
  DEBUG_BUILD$2 && result === null && debug.log(`Event processor "${processor.id || "?"}" dropped event`);
  if (isThenable(result)) {
    return result.then((final) => _notifyEventProcessors(final, hint, processors, index + 1));
  }
  return _notifyEventProcessors(result, hint, processors, index + 1);
}
let parsedStackResults;
let lastSentryKeysCount;
let lastNativeKeysCount;
let cachedFilenameDebugIds;
function getFilenameToDebugIdMap(stackParser) {
  const sentryDebugIdMap = GLOBAL_OBJ._sentryDebugIds;
  const nativeDebugIdMap = GLOBAL_OBJ._debugIds;
  if (!sentryDebugIdMap && !nativeDebugIdMap) {
    return {};
  }
  const sentryDebugIdKeys = sentryDebugIdMap ? Object.keys(sentryDebugIdMap) : [];
  const nativeDebugIdKeys = nativeDebugIdMap ? Object.keys(nativeDebugIdMap) : [];
  if (cachedFilenameDebugIds && sentryDebugIdKeys.length === lastSentryKeysCount && nativeDebugIdKeys.length === lastNativeKeysCount) {
    return cachedFilenameDebugIds;
  }
  lastSentryKeysCount = sentryDebugIdKeys.length;
  lastNativeKeysCount = nativeDebugIdKeys.length;
  cachedFilenameDebugIds = {};
  if (!parsedStackResults) {
    parsedStackResults = {};
  }
  const processDebugIds = (debugIdKeys, debugIdMap) => {
    for (const key of debugIdKeys) {
      const debugId = debugIdMap[key];
      const result = parsedStackResults == null ? void 0 : parsedStackResults[key];
      if (result && cachedFilenameDebugIds && debugId) {
        cachedFilenameDebugIds[result[0]] = debugId;
        if (parsedStackResults) {
          parsedStackResults[key] = [result[0], debugId];
        }
      } else if (debugId) {
        const parsedStack = stackParser(key);
        for (let i2 = parsedStack.length - 1; i2 >= 0; i2--) {
          const stackFrame = parsedStack[i2];
          const filename = stackFrame == null ? void 0 : stackFrame.filename;
          if (filename && cachedFilenameDebugIds && parsedStackResults) {
            cachedFilenameDebugIds[filename] = debugId;
            parsedStackResults[key] = [filename, debugId];
            break;
          }
        }
      }
    }
  };
  if (sentryDebugIdMap) {
    processDebugIds(sentryDebugIdKeys, sentryDebugIdMap);
  }
  if (nativeDebugIdMap) {
    processDebugIds(nativeDebugIdKeys, nativeDebugIdMap);
  }
  return cachedFilenameDebugIds;
}
function prepareEvent(options, event, hint, scope2, client2, isolationScope) {
  const { normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = options;
  const prepared = {
    ...event,
    event_id: event.event_id || hint.event_id || uuid4(),
    timestamp: event.timestamp || dateTimestampInSeconds()
  };
  const integrations = hint.integrations || options.integrations.map((i2) => i2.name);
  applyClientOptions(prepared, options);
  applyIntegrationsMetadata(prepared, integrations);
  if (client2) {
    client2.emit("applyFrameMetadata", event);
  }
  if (event.type === void 0) {
    applyDebugIds(prepared, options.stackParser);
  }
  const finalScope = getFinalScope(scope2, hint.captureContext);
  if (hint.mechanism) {
    addExceptionMechanism(prepared, hint.mechanism);
  }
  const clientEventProcessors = client2 ? client2.getEventProcessors() : [];
  const data = getCombinedScopeData(isolationScope, finalScope);
  const attachments = [...hint.attachments || [], ...data.attachments];
  if (attachments.length) {
    hint.attachments = attachments;
  }
  applyScopeDataToEvent(prepared, data);
  const eventProcessors = [
    ...clientEventProcessors,
    // Run scope event processors _after_ all other processors
    ...data.eventProcessors
  ];
  const isInternalException = hint.data && hint.data.__sentry__ === true;
  const result = isInternalException ? resolvedSyncPromise(prepared) : notifyEventProcessors(eventProcessors, prepared, hint);
  return result.then((evt) => {
    if (evt) {
      applyDebugMeta(evt);
    }
    if (typeof normalizeDepth === "number" && normalizeDepth > 0) {
      return normalizeEvent(evt, normalizeDepth, normalizeMaxBreadth);
    }
    return evt;
  });
}
function applyClientOptions(event, options) {
  var _a, _b;
  const { environment, release, dist, maxValueLength } = options;
  event.environment = event.environment || environment || DEFAULT_ENVIRONMENT;
  if (!event.release && release) {
    event.release = release;
  }
  if (!event.dist && dist) {
    event.dist = dist;
  }
  const request = event.request;
  if ((request == null ? void 0 : request.url) && maxValueLength) {
    request.url = truncate(request.url, maxValueLength);
  }
  if (maxValueLength) {
    (_b = (_a = event.exception) == null ? void 0 : _a.values) == null ? void 0 : _b.forEach((exception) => {
      if (exception.value) {
        exception.value = truncate(exception.value, maxValueLength);
      }
    });
  }
}
function applyDebugIds(event, stackParser) {
  var _a, _b;
  const filenameDebugIdMap = getFilenameToDebugIdMap(stackParser);
  (_b = (_a = event.exception) == null ? void 0 : _a.values) == null ? void 0 : _b.forEach((exception) => {
    var _a2, _b2;
    (_b2 = (_a2 = exception.stacktrace) == null ? void 0 : _a2.frames) == null ? void 0 : _b2.forEach((frame) => {
      if (frame.filename) {
        frame.debug_id = filenameDebugIdMap[frame.filename];
      }
    });
  });
}
function applyDebugMeta(event) {
  var _a, _b;
  const filenameDebugIdMap = {};
  (_b = (_a = event.exception) == null ? void 0 : _a.values) == null ? void 0 : _b.forEach((exception) => {
    var _a2, _b2;
    (_b2 = (_a2 = exception.stacktrace) == null ? void 0 : _a2.frames) == null ? void 0 : _b2.forEach((frame) => {
      if (frame.debug_id) {
        if (frame.abs_path) {
          filenameDebugIdMap[frame.abs_path] = frame.debug_id;
        } else if (frame.filename) {
          filenameDebugIdMap[frame.filename] = frame.debug_id;
        }
        delete frame.debug_id;
      }
    });
  });
  if (Object.keys(filenameDebugIdMap).length === 0) {
    return;
  }
  event.debug_meta = event.debug_meta || {};
  event.debug_meta.images = event.debug_meta.images || [];
  const images = event.debug_meta.images;
  Object.entries(filenameDebugIdMap).forEach(([filename, debug_id]) => {
    images.push({
      type: "sourcemap",
      code_file: filename,
      debug_id
    });
  });
}
function applyIntegrationsMetadata(event, integrationNames) {
  if (integrationNames.length > 0) {
    event.sdk = event.sdk || {};
    event.sdk.integrations = [...event.sdk.integrations || [], ...integrationNames];
  }
}
function normalizeEvent(event, depth, maxBreadth) {
  var _a, _b;
  if (!event) {
    return null;
  }
  const normalized = {
    ...event,
    ...event.breadcrumbs && {
      breadcrumbs: event.breadcrumbs.map((b) => ({
        ...b,
        ...b.data && {
          data: normalize(b.data, depth, maxBreadth)
        }
      }))
    },
    ...event.user && {
      user: normalize(event.user, depth, maxBreadth)
    },
    ...event.contexts && {
      contexts: normalize(event.contexts, depth, maxBreadth)
    },
    ...event.extra && {
      extra: normalize(event.extra, depth, maxBreadth)
    }
  };
  if (((_a = event.contexts) == null ? void 0 : _a.trace) && normalized.contexts) {
    normalized.contexts.trace = event.contexts.trace;
    if (event.contexts.trace.data) {
      normalized.contexts.trace.data = normalize(event.contexts.trace.data, depth, maxBreadth);
    }
  }
  if (event.spans) {
    normalized.spans = event.spans.map((span) => {
      return {
        ...span,
        ...span.data && {
          data: normalize(span.data, depth, maxBreadth)
        }
      };
    });
  }
  if (((_b = event.contexts) == null ? void 0 : _b.flags) && normalized.contexts) {
    normalized.contexts.flags = normalize(event.contexts.flags, 3, maxBreadth);
  }
  return normalized;
}
function getFinalScope(scope2, captureContext) {
  if (!captureContext) {
    return scope2;
  }
  const finalScope = scope2 ? scope2.clone() : new Scope();
  finalScope.update(captureContext);
  return finalScope;
}
function parseEventHintOrCaptureContext(hint) {
  {
    return void 0;
  }
}
function captureException(exception, hint) {
  return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext());
}
function captureEvent(event, hint) {
  return getCurrentScope().captureEvent(event, hint);
}
function startSession(context) {
  const isolationScope = getIsolationScope();
  const { user } = getCombinedScopeData(isolationScope, getCurrentScope());
  const { userAgent: userAgent2 } = GLOBAL_OBJ.navigator || {};
  const session = makeSession({
    user,
    ...userAgent2 && { userAgent: userAgent2 },
    ...context
  });
  const currentSession = isolationScope.getSession();
  if ((currentSession == null ? void 0 : currentSession.status) === "ok") {
    updateSession(currentSession, { status: "exited" });
  }
  endSession();
  isolationScope.setSession(session);
  return session;
}
function endSession() {
  const isolationScope = getIsolationScope();
  const currentScope = getCurrentScope();
  const session = currentScope.getSession() || isolationScope.getSession();
  if (session) {
    closeSession(session);
  }
  _sendSessionUpdate();
  isolationScope.setSession();
}
function _sendSessionUpdate() {
  const isolationScope = getIsolationScope();
  const client2 = getClient();
  const session = isolationScope.getSession();
  if (session && client2) {
    client2.captureSession(session);
  }
}
function captureSession(end2 = false) {
  if (end2) {
    endSession();
    return;
  }
  _sendSessionUpdate();
}
const SENTRY_API_VERSION = "7";
function getBaseApiEndpoint(dsn) {
  const protocol = dsn.protocol ? `${dsn.protocol}:` : "";
  const port = dsn.port ? `:${dsn.port}` : "";
  return `${protocol}//${dsn.host}${port}${dsn.path ? `/${dsn.path}` : ""}/api/`;
}
function _getIngestEndpoint(dsn) {
  return `${getBaseApiEndpoint(dsn)}${dsn.projectId}/envelope/`;
}
function _encodedAuth(dsn, sdkInfo) {
  const params = {
    sentry_version: SENTRY_API_VERSION
  };
  if (dsn.publicKey) {
    params.sentry_key = dsn.publicKey;
  }
  if (sdkInfo) {
    params.sentry_client = `${sdkInfo.name}/${sdkInfo.version}`;
  }
  return new URLSearchParams(params).toString();
}
function getEnvelopeEndpointWithUrlEncodedAuth(dsn, tunnel, sdkInfo) {
  return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuth(dsn, sdkInfo)}`;
}
const installedIntegrations = [];
function setupIntegrations(client2, integrations) {
  const integrationIndex = {};
  integrations.forEach((integration) => {
    if (integration == null ? void 0 : integration.beforeSetup) {
      integration.beforeSetup(client2);
    }
  });
  integrations.forEach((integration) => {
    if (integration) {
      setupIntegration(client2, integration, integrationIndex);
    }
  });
  return integrationIndex;
}
function afterSetupIntegrations(client2, integrations) {
  for (const integration of integrations) {
    if (integration == null ? void 0 : integration.afterAllSetup) {
      integration.afterAllSetup(client2);
    }
  }
}
function setupIntegration(client2, integration, integrationIndex) {
  if (integrationIndex[integration.name]) {
    DEBUG_BUILD$2 && debug.log(`Integration skipped because it was already installed: ${integration.name}`);
    return;
  }
  integrationIndex[integration.name] = integration;
  if (!installedIntegrations.includes(integration.name) && typeof integration.setupOnce === "function") {
    integration.setupOnce();
    installedIntegrations.push(integration.name);
  }
  if (integration.setup && typeof integration.setup === "function") {
    integration.setup(client2);
  }
  if (typeof integration.preprocessEvent === "function") {
    const callback = integration.preprocessEvent.bind(integration);
    client2.on("preprocessEvent", (event, hint) => callback(event, hint, client2));
  }
  if (typeof integration.processEvent === "function") {
    const callback = integration.processEvent.bind(integration);
    const processor = Object.assign((event, hint) => callback(event, hint, client2), {
      id: integration.name
    });
    client2.addEventProcessor(processor);
  }
  DEBUG_BUILD$2 && debug.log(`Integration installed: ${integration.name}`);
}
function defineIntegration(fn) {
  return fn;
}
function createLogContainerEnvelopeItem(items) {
  return [
    {
      type: "log",
      item_count: items.length,
      content_type: "application/vnd.sentry.items.log+json"
    },
    {
      items
    }
  ];
}
function createLogEnvelope(logs, metadata, tunnel, dsn) {
  const headers = {};
  if (metadata == null ? void 0 : metadata.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version
    };
  }
  if (!!tunnel && !!dsn) {
    headers.dsn = dsnToString(dsn);
  }
  return createEnvelope(headers, [createLogContainerEnvelopeItem(logs)]);
}
function _INTERNAL_flushLogsBuffer(client2, maybeLogBuffer) {
  const logBuffer = maybeLogBuffer ?? _INTERNAL_getLogBuffer(client2) ?? [];
  if (logBuffer.length === 0) {
    return;
  }
  const clientOptions = client2.getOptions();
  const envelope = createLogEnvelope(logBuffer, clientOptions._metadata, clientOptions.tunnel, client2.getDsn());
  _getBufferMap$1().set(client2, []);
  client2.emit("flushLogs");
  client2.sendEnvelope(envelope);
}
function _INTERNAL_getLogBuffer(client2) {
  return _getBufferMap$1().get(client2);
}
function _getBufferMap$1() {
  return getGlobalSingleton("clientToLogBufferMap", () => /* @__PURE__ */ new WeakMap());
}
function createMetricContainerEnvelopeItem(items) {
  return [
    {
      type: "trace_metric",
      item_count: items.length,
      content_type: "application/vnd.sentry.items.trace-metric+json"
    },
    {
      items
    }
  ];
}
function createMetricEnvelope(metrics, metadata, tunnel, dsn) {
  const headers = {};
  if (metadata == null ? void 0 : metadata.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version
    };
  }
  if (!!tunnel && !!dsn) {
    headers.dsn = dsnToString(dsn);
  }
  return createEnvelope(headers, [createMetricContainerEnvelopeItem(metrics)]);
}
function _INTERNAL_flushMetricsBuffer(client2, maybeMetricBuffer) {
  const metricBuffer = maybeMetricBuffer ?? _INTERNAL_getMetricBuffer(client2) ?? [];
  if (metricBuffer.length === 0) {
    return;
  }
  const clientOptions = client2.getOptions();
  const envelope = createMetricEnvelope(metricBuffer, clientOptions._metadata, clientOptions.tunnel, client2.getDsn());
  _getBufferMap().set(client2, []);
  client2.emit("flushMetrics");
  client2.sendEnvelope(envelope);
}
function _INTERNAL_getMetricBuffer(client2) {
  return _getBufferMap().get(client2);
}
function _getBufferMap() {
  return getGlobalSingleton("clientToMetricBufferMap", () => /* @__PURE__ */ new WeakMap());
}
function safeUnref(timer) {
  if (typeof timer === "object" && typeof timer.unref === "function") {
    timer.unref();
  }
  return timer;
}
const SENTRY_BUFFER_FULL_ERROR = Symbol.for("SentryBufferFullError");
function makePromiseBuffer(limit = 100) {
  const buffer = /* @__PURE__ */ new Set();
  function isReady() {
    return buffer.size < limit;
  }
  function remove(task) {
    buffer.delete(task);
  }
  function add(taskProducer) {
    if (!isReady()) {
      return rejectedSyncPromise(SENTRY_BUFFER_FULL_ERROR);
    }
    const task = taskProducer();
    buffer.add(task);
    void task.then(
      () => remove(task),
      () => remove(task)
    );
    return task;
  }
  function drain(timeout) {
    if (!buffer.size) {
      return resolvedSyncPromise(true);
    }
    const drainPromise = Promise.allSettled(Array.from(buffer)).then(() => true);
    if (!timeout) {
      return drainPromise;
    }
    const promises = [
      drainPromise,
      new Promise((resolve) => safeUnref(setTimeout(() => resolve(false), timeout)))
    ];
    return Promise.race(promises);
  }
  return {
    get $() {
      return Array.from(buffer);
    },
    add,
    drain
  };
}
const DEFAULT_RETRY_AFTER = 60 * 1e3;
function parseRetryAfterHeader(header, now = safeDateNow()) {
  const headerDelay = parseInt(`${header}`, 10);
  if (!isNaN(headerDelay)) {
    return headerDelay * 1e3;
  }
  const headerDate = Date.parse(`${header}`);
  if (!isNaN(headerDate)) {
    return headerDate - now;
  }
  return DEFAULT_RETRY_AFTER;
}
function disabledUntil(limits, dataCategory) {
  return limits[dataCategory] || limits.all || 0;
}
function isRateLimited(limits, dataCategory, now = safeDateNow()) {
  return disabledUntil(limits, dataCategory) > now;
}
function updateRateLimits(limits, { statusCode, headers }, now = safeDateNow()) {
  const updatedRateLimits = {
    ...limits
  };
  const rateLimitHeader = headers == null ? void 0 : headers["x-sentry-rate-limits"];
  const retryAfterHeader = headers == null ? void 0 : headers["retry-after"];
  if (rateLimitHeader) {
    for (const limit of rateLimitHeader.trim().split(",")) {
      const [retryAfter, categories, , , namespaces] = limit.split(":", 5);
      const headerDelay = parseInt(retryAfter, 10);
      const delay = (!isNaN(headerDelay) ? headerDelay : 60) * 1e3;
      if (!categories) {
        updatedRateLimits.all = now + delay;
      } else {
        for (const category of categories.split(";")) {
          if (category === "metric_bucket") {
            if (!namespaces || namespaces.split(";").includes("custom")) {
              updatedRateLimits[category] = now + delay;
            }
          } else {
            updatedRateLimits[category] = now + delay;
          }
        }
      }
    }
  } else if (retryAfterHeader) {
    updatedRateLimits.all = now + parseRetryAfterHeader(retryAfterHeader, now);
  } else if (statusCode === 429) {
    updatedRateLimits.all = now + 60 * 1e3;
  }
  return updatedRateLimits;
}
const DEFAULT_TRANSPORT_BUFFER_SIZE = 64;
function createTransport(options, makeRequest, buffer = makePromiseBuffer(
  options.bufferSize || DEFAULT_TRANSPORT_BUFFER_SIZE
)) {
  let rateLimits = {};
  const flush = (timeout) => buffer.drain(timeout);
  function send(envelope) {
    const filteredEnvelopeItems = [];
    forEachEnvelopeItem(envelope, (item2, type) => {
      const dataCategory = envelopeItemTypeToDataCategory(type);
      if (isRateLimited(rateLimits, dataCategory)) {
        options.recordDroppedEvent("ratelimit_backoff", dataCategory);
      } else {
        filteredEnvelopeItems.push(item2);
      }
    });
    if (filteredEnvelopeItems.length === 0) {
      return Promise.resolve({});
    }
    const filteredEnvelope = createEnvelope(envelope[0], filteredEnvelopeItems);
    const recordEnvelopeLoss = (reason) => {
      if (envelopeContainsItemType(filteredEnvelope, ["client_report"])) {
        DEBUG_BUILD$2 && debug.warn(`Dropping client report. Will not send outcomes (reason: ${reason}).`);
        return;
      }
      forEachEnvelopeItem(filteredEnvelope, (item2, type) => {
        options.recordDroppedEvent(reason, envelopeItemTypeToDataCategory(type));
      });
    };
    const requestTask = () => makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then(
      (response) => {
        if (response.statusCode === 413) {
          DEBUG_BUILD$2 && debug.error(
            "Sentry responded with status code 413. Envelope was discarded due to exceeding size limits."
          );
          recordEnvelopeLoss("send_error");
          return response;
        }
        if (DEBUG_BUILD$2 && response.statusCode !== void 0 && (response.statusCode < 200 || response.statusCode >= 300)) {
          debug.warn(`Sentry responded with status code ${response.statusCode} to sent event.`);
        }
        rateLimits = updateRateLimits(rateLimits, response);
        return response;
      },
      (error2) => {
        recordEnvelopeLoss("network_error");
        DEBUG_BUILD$2 && debug.error("Encountered error running transport request:", error2);
        throw error2;
      }
    );
    return buffer.add(requestTask).then(
      (result) => result,
      (error2) => {
        if (error2 === SENTRY_BUFFER_FULL_ERROR) {
          DEBUG_BUILD$2 && debug.error("Skipped sending event because buffer is full.");
          recordEnvelopeLoss("queue_overflow");
          return Promise.resolve({});
        } else {
          throw error2;
        }
      }
    );
  }
  return {
    send,
    flush
  };
}
function createClientReportEnvelope(discarded_events, dsn, timestamp) {
  const clientReportItem = [
    { type: "client_report" },
    {
      timestamp: dateTimestampInSeconds(),
      discarded_events
    }
  ];
  return createEnvelope(dsn ? { dsn } : {}, [clientReportItem]);
}
function getPossibleEventMessages(event) {
  const possibleMessages = [];
  if (event.message) {
    possibleMessages.push(event.message);
  }
  try {
    const lastException = event.exception.values[event.exception.values.length - 1];
    if (lastException == null ? void 0 : lastException.value) {
      possibleMessages.push(lastException.value);
      if (lastException.type) {
        possibleMessages.push(`${lastException.type}: ${lastException.value}`);
      }
    }
  } catch {
  }
  return possibleMessages;
}
function convertTransactionEventToSpanJson(event) {
  var _a;
  const { trace_id, parent_span_id, span_id, status, origin, data, op } = ((_a = event.contexts) == null ? void 0 : _a.trace) ?? {};
  return {
    data: data ?? {},
    description: event.transaction,
    op,
    parent_span_id,
    span_id: span_id ?? "",
    start_timestamp: event.start_timestamp ?? 0,
    status,
    timestamp: event.timestamp,
    trace_id: trace_id ?? "",
    origin,
    profile_id: data == null ? void 0 : data[SEMANTIC_ATTRIBUTE_PROFILE_ID],
    exclusive_time: data == null ? void 0 : data[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
    measurements: event.measurements,
    is_segment: true
  };
}
function convertSpanJsonToTransactionEvent(span) {
  return {
    type: "transaction",
    timestamp: span.timestamp,
    start_timestamp: span.start_timestamp,
    transaction: span.description,
    contexts: {
      trace: {
        trace_id: span.trace_id,
        span_id: span.span_id,
        parent_span_id: span.parent_span_id,
        op: span.op,
        status: span.status,
        origin: span.origin,
        data: {
          ...span.data,
          ...span.profile_id && { [SEMANTIC_ATTRIBUTE_PROFILE_ID]: span.profile_id },
          ...span.exclusive_time && { [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: span.exclusive_time }
        }
      }
    },
    measurements: span.measurements
  };
}
const ALREADY_SEEN_ERROR = "Not capturing exception because it's already been captured.";
const MISSING_RELEASE_FOR_SESSION_ERROR = "Discarded session because of missing or non-string release";
const INTERNAL_ERROR_SYMBOL = Symbol.for("SentryInternalError");
const DO_NOT_SEND_EVENT_SYMBOL = Symbol.for("SentryDoNotSendEventError");
const DEFAULT_FLUSH_INTERVAL = 5e3;
function _makeInternalError(message) {
  return {
    message,
    [INTERNAL_ERROR_SYMBOL]: true
  };
}
function _makeDoNotSendEventError(message) {
  return {
    message,
    [DO_NOT_SEND_EVENT_SYMBOL]: true
  };
}
function _isInternalError(error2) {
  return !!error2 && typeof error2 === "object" && INTERNAL_ERROR_SYMBOL in error2;
}
function _isDoNotSendEventError(error2) {
  return !!error2 && typeof error2 === "object" && DO_NOT_SEND_EVENT_SYMBOL in error2;
}
function setupWeightBasedFlushing(client2, afterCaptureHook, flushHook, estimateSizeFn, flushFn) {
  let weight = 0;
  let flushTimeout;
  let isTimerActive = false;
  client2.on(flushHook, () => {
    weight = 0;
    clearTimeout(flushTimeout);
    isTimerActive = false;
  });
  client2.on(afterCaptureHook, (item2) => {
    weight += estimateSizeFn(item2);
    if (weight >= 8e5) {
      flushFn(client2);
    } else if (!isTimerActive) {
      isTimerActive = true;
      flushTimeout = safeUnref(
        setTimeout(() => {
          flushFn(client2);
        }, DEFAULT_FLUSH_INTERVAL)
      );
    }
  });
  client2.on("flush", () => {
    flushFn(client2);
  });
}
class Client {
  /** Options passed to the SDK. */
  /** The client Dsn, if specified in options. Without this Dsn, the SDK will be disabled. */
  /** Array of set up integrations. */
  /** Number of calls being processed */
  /** Holds flushable  */
  // eslint-disable-next-line @typescript-eslint/ban-types
  /**
   * Initializes this client instance.
   *
   * @param options Options for the client.
   */
  constructor(options) {
    var _a, _b, _c;
    this._options = options;
    this._integrations = {};
    this._numProcessing = 0;
    this._outcomes = {};
    this._hooks = {};
    this._eventProcessors = [];
    this._promiseBuffer = makePromiseBuffer(((_a = options.transportOptions) == null ? void 0 : _a.bufferSize) ?? DEFAULT_TRANSPORT_BUFFER_SIZE);
    if (options.dsn) {
      this._dsn = makeDsn(options.dsn);
    } else {
      DEBUG_BUILD$2 && debug.warn("No DSN provided, client will not send events.");
    }
    if (this._dsn) {
      const url = getEnvelopeEndpointWithUrlEncodedAuth(
        this._dsn,
        options.tunnel,
        options._metadata ? options._metadata.sdk : void 0
      );
      this._transport = options.transport({
        tunnel: this._options.tunnel,
        recordDroppedEvent: this.recordDroppedEvent.bind(this),
        ...options.transportOptions,
        url
      });
    }
    this._options.enableLogs = this._options.enableLogs ?? ((_b = this._options._experiments) == null ? void 0 : _b.enableLogs);
    if (this._options.enableLogs) {
      setupWeightBasedFlushing(this, "afterCaptureLog", "flushLogs", estimateLogSizeInBytes, _INTERNAL_flushLogsBuffer);
    }
    const enableMetrics = this._options.enableMetrics ?? ((_c = this._options._experiments) == null ? void 0 : _c.enableMetrics) ?? true;
    if (enableMetrics) {
      setupWeightBasedFlushing(
        this,
        "afterCaptureMetric",
        "flushMetrics",
        estimateMetricSizeInBytes,
        _INTERNAL_flushMetricsBuffer
      );
    }
  }
  /**
   * Captures an exception event and sends it to Sentry.
   *
   * Unlike `captureException` exported from every SDK, this method requires that you pass it the current scope.
   */
  captureException(exception, hint, scope2) {
    const eventId = uuid4();
    if (checkOrSetAlreadyCaught(exception)) {
      DEBUG_BUILD$2 && debug.log(ALREADY_SEEN_ERROR);
      return eventId;
    }
    const hintWithEventId = {
      event_id: eventId,
      ...hint
    };
    this._process(
      () => this.eventFromException(exception, hintWithEventId).then((event) => this._captureEvent(event, hintWithEventId, scope2)).then((res) => res),
      "error"
    );
    return hintWithEventId.event_id;
  }
  /**
   * Captures a message event and sends it to Sentry.
   *
   * Unlike `captureMessage` exported from every SDK, this method requires that you pass it the current scope.
   */
  captureMessage(message, level, hint, currentScope) {
    const hintWithEventId = {
      event_id: uuid4(),
      ...hint
    };
    const eventMessage = isParameterizedString(message) ? message : String(message);
    const isMessage = isPrimitive(message);
    const promisedEvent = isMessage ? this.eventFromMessage(eventMessage, level, hintWithEventId) : this.eventFromException(message, hintWithEventId);
    this._process(
      () => promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)),
      isMessage ? "unknown" : "error"
    );
    return hintWithEventId.event_id;
  }
  /**
   * Captures a manually created event and sends it to Sentry.
   *
   * Unlike `captureEvent` exported from every SDK, this method requires that you pass it the current scope.
   */
  captureEvent(event, hint, currentScope) {
    const eventId = uuid4();
    if ((hint == null ? void 0 : hint.originalException) && checkOrSetAlreadyCaught(hint.originalException)) {
      DEBUG_BUILD$2 && debug.log(ALREADY_SEEN_ERROR);
      return eventId;
    }
    const hintWithEventId = {
      event_id: eventId,
      ...hint
    };
    const sdkProcessingMetadata = event.sdkProcessingMetadata || {};
    const capturedSpanScope = sdkProcessingMetadata.capturedSpanScope;
    const capturedSpanIsolationScope = sdkProcessingMetadata.capturedSpanIsolationScope;
    const dataCategory = getDataCategoryByType(event.type);
    this._process(
      () => this._captureEvent(event, hintWithEventId, capturedSpanScope || currentScope, capturedSpanIsolationScope),
      dataCategory
    );
    return hintWithEventId.event_id;
  }
  /**
   * Captures a session.
   */
  captureSession(session) {
    this.sendSession(session);
    updateSession(session, { init: false });
  }
  /**
   * Create a cron monitor check in and send it to Sentry. This method is not available on all clients.
   *
   * @param checkIn An object that describes a check in.
   * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
   * to create a monitor automatically when sending a check in.
   * @param scope An optional scope containing event metadata.
   * @returns A string representing the id of the check in.
   */
  /**
   * Get the current Dsn.
   */
  getDsn() {
    return this._dsn;
  }
  /**
   * Get the current options.
   */
  getOptions() {
    return this._options;
  }
  /**
   * Get the SDK metadata.
   * @see SdkMetadata
   */
  getSdkMetadata() {
    return this._options._metadata;
  }
  /**
   * Returns the transport that is used by the client.
   * Please note that the transport gets lazy initialized so it will only be there once the first event has been sent.
   */
  getTransport() {
    return this._transport;
  }
  /**
   * Wait for all events to be sent or the timeout to expire, whichever comes first.
   *
   * @param timeout Maximum time in ms the client should wait for events to be flushed. Omitting this parameter will
   *   cause the client to wait until all events are sent before resolving the promise.
   * @returns A promise that will resolve with `true` if all events are sent before the timeout, or `false` if there are
   * still events in the queue when the timeout is reached.
   */
  // @ts-expect-error - PromiseLike is a subset of Promise
  async flush(timeout) {
    const transport = this._transport;
    if (!transport) {
      return true;
    }
    this.emit("flush");
    const clientFinished = await this._isClientDoneProcessing(timeout);
    const transportFlushed = await transport.flush(timeout);
    return clientFinished && transportFlushed;
  }
  /**
   * Flush the event queue and set the client to `enabled = false`. See {@link Client.flush}.
   *
   * @param {number} timeout Maximum time in ms the client should wait before shutting down. Omitting this parameter will cause
   *   the client to wait until all events are sent before disabling itself.
   * @returns {Promise<boolean>} A promise which resolves to `true` if the flush completes successfully before the timeout, or `false` if
   * it doesn't.
   */
  // @ts-expect-error - PromiseLike is a subset of Promise
  async close(timeout) {
    _INTERNAL_flushLogsBuffer(this);
    const result = await this.flush(timeout);
    this.getOptions().enabled = false;
    this.emit("close");
    return result;
  }
  /**
   * Get all installed event processors.
   */
  getEventProcessors() {
    return this._eventProcessors;
  }
  /**
   * Adds an event processor that applies to any event processed by this client.
   */
  addEventProcessor(eventProcessor) {
    this._eventProcessors.push(eventProcessor);
  }
  /**
   * Initialize this client.
   * Call this after the client was set on a scope.
   */
  init() {
    if (this._isEnabled() || // Force integrations to be setup even if no DSN was set when we have
    // Spotlight enabled. This is particularly important for browser as we
    // don't support the `spotlight` option there and rely on the users
    // adding the `spotlightBrowserIntegration()` to their integrations which
    // wouldn't get initialized with the check below when there's no DSN set.
    this._options.integrations.some(({ name }) => name.startsWith("Spotlight"))) {
      this._setupIntegrations();
    }
  }
  /**
   * Gets an installed integration by its name.
   *
   * @returns {Integration|undefined} The installed integration or `undefined` if no integration with that `name` was installed.
   */
  getIntegrationByName(integrationName) {
    return this._integrations[integrationName];
  }
  /**
   * Add an integration to the client.
   * This can be used to e.g. lazy load integrations.
   * In most cases, this should not be necessary,
   * and you're better off just passing the integrations via `integrations: []` at initialization time.
   * However, if you find the need to conditionally load & add an integration, you can use `addIntegration` to do so.
   */
  addIntegration(integration) {
    const isAlreadyInstalled = this._integrations[integration.name];
    if (!isAlreadyInstalled && integration.beforeSetup) {
      integration.beforeSetup(this);
    }
    setupIntegration(this, integration, this._integrations);
    if (!isAlreadyInstalled) {
      afterSetupIntegrations(this, [integration]);
    }
  }
  /**
   * Send a fully prepared event to Sentry.
   */
  sendEvent(event, hint = {}) {
    this.emit("beforeSendEvent", event, hint);
    let env = createEventEnvelope(event, this._dsn, this._options._metadata, this._options.tunnel);
    for (const attachment of hint.attachments || []) {
      env = addItemToEnvelope(env, createAttachmentEnvelopeItem(attachment));
    }
    this.sendEnvelope(env).then((sendResponse) => this.emit("afterSendEvent", event, sendResponse));
  }
  /**
   * Send a session or session aggregrates to Sentry.
   */
  sendSession(session) {
    const { release: clientReleaseOption, environment: clientEnvironmentOption = DEFAULT_ENVIRONMENT } = this._options;
    if ("aggregates" in session) {
      const sessionAttrs = session.attrs || {};
      if (!sessionAttrs.release && !clientReleaseOption) {
        DEBUG_BUILD$2 && debug.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
        return;
      }
      sessionAttrs.release = sessionAttrs.release || clientReleaseOption;
      sessionAttrs.environment = sessionAttrs.environment || clientEnvironmentOption;
      session.attrs = sessionAttrs;
    } else {
      if (!session.release && !clientReleaseOption) {
        DEBUG_BUILD$2 && debug.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
        return;
      }
      session.release = session.release || clientReleaseOption;
      session.environment = session.environment || clientEnvironmentOption;
    }
    this.emit("beforeSendSession", session);
    const env = createSessionEnvelope(session, this._dsn, this._options._metadata, this._options.tunnel);
    this.sendEnvelope(env);
  }
  /**
   * Record on the client that an event got dropped (ie, an event that will not be sent to Sentry).
   */
  recordDroppedEvent(reason, category, count = 1) {
    if (this._options.sendClientReports) {
      const key = `${reason}:${category}`;
      DEBUG_BUILD$2 && debug.log(`Recording outcome: "${key}"${count > 1 ? ` (${count} times)` : ""}`);
      this._outcomes[key] = (this._outcomes[key] || 0) + count;
    }
  }
  /* eslint-disable @typescript-eslint/unified-signatures */
  /**
   * Register a callback for whenever a span is started.
   * Receives the span as argument.
   * @returns {() => void} A function that, when executed, removes the registered callback.
   */
  /**
   * Register a hook on this client.
   */
  on(hook, callback) {
    const hookCallbacks = this._hooks[hook] = this._hooks[hook] || /* @__PURE__ */ new Set();
    const uniqueCallback = (...args) => callback(...args);
    hookCallbacks.add(uniqueCallback);
    return () => {
      hookCallbacks.delete(uniqueCallback);
    };
  }
  /** Fire a hook whenever a span starts. */
  /**
   * Emit a hook that was previously registered via `on()`.
   */
  emit(hook, ...rest) {
    const callbacks = this._hooks[hook];
    if (callbacks) {
      callbacks.forEach((callback) => callback(...rest));
    }
  }
  /**
   * Send an envelope to Sentry.
   */
  // @ts-expect-error - PromiseLike is a subset of Promise
  async sendEnvelope(envelope) {
    this.emit("beforeEnvelope", envelope);
    if (this._isEnabled() && this._transport) {
      try {
        return await this._transport.send(envelope);
      } catch (reason) {
        DEBUG_BUILD$2 && debug.error("Error while sending envelope:", reason);
        return {};
      }
    }
    DEBUG_BUILD$2 && debug.error("Transport disabled");
    return {};
  }
  /**
   * Disposes of the client and releases all resources.
   *
   * Subclasses should override this method to clean up their own resources.
   * After calling dispose(), the client should not be used anymore.
   */
  dispose() {
  }
  /* eslint-enable @typescript-eslint/unified-signatures */
  /** Setup integrations for this client. */
  _setupIntegrations() {
    const { integrations } = this._options;
    this._integrations = setupIntegrations(this, integrations);
    afterSetupIntegrations(this, integrations);
  }
  /** Updates existing session based on the provided event */
  _updateSessionFromEvent(session, event) {
    var _a, _b;
    let crashed = event.level === "fatal";
    let errored = false;
    const exceptions = (_a = event.exception) == null ? void 0 : _a.values;
    if (exceptions) {
      errored = true;
      crashed = false;
      for (const ex of exceptions) {
        if (((_b = ex.mechanism) == null ? void 0 : _b.handled) === false) {
          crashed = true;
          break;
        }
      }
    }
    const sessionNonTerminal = session.status === "ok";
    const shouldUpdateAndSend = sessionNonTerminal && session.errors === 0 || sessionNonTerminal && crashed;
    if (shouldUpdateAndSend) {
      updateSession(session, {
        ...crashed && { status: "crashed" },
        errors: session.errors || Number(errored || crashed)
      });
      this.captureSession(session);
    }
  }
  /**
   * Determine if the client is finished processing. Returns a promise because it will wait `timeout` ms before saying
   * "no" (resolving to `false`) in order to give the client a chance to potentially finish first.
   *
   * @param timeout The time, in ms, after which to resolve to `false` if the client is still busy. Passing `0` (or not
   * passing anything) will make the promise wait as long as it takes for processing to finish before resolving to
   * `true`.
   * @returns A promise which will resolve to `true` if processing is already done or finishes before the timeout, and
   * `false` otherwise
   */
  async _isClientDoneProcessing(timeout) {
    let ticked = 0;
    while (!timeout || ticked < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (!this._numProcessing) {
        return true;
      }
      ticked++;
    }
    return false;
  }
  /** Determines whether this SDK is enabled and a transport is present. */
  _isEnabled() {
    return this.getOptions().enabled !== false && this._transport !== void 0;
  }
  /**
   * Adds common information to events.
   *
   * The information includes release and environment from `options`,
   * breadcrumbs and context (extra, tags and user) from the scope.
   *
   * Information that is already present in the event is never overwritten. For
   * nested objects, such as the context, keys are merged.
   *
   * @param event The original event.
   * @param hint May contain additional information about the original exception.
   * @param currentScope A scope containing event metadata.
   * @returns A new event with more information.
   */
  _prepareEvent(event, hint, currentScope, isolationScope) {
    const options = this.getOptions();
    const integrations = Object.keys(this._integrations);
    if (!hint.integrations && (integrations == null ? void 0 : integrations.length)) {
      hint.integrations = integrations;
    }
    this.emit("preprocessEvent", event, hint);
    if (!event.type) {
      isolationScope.setLastEventId(event.event_id || hint.event_id);
    }
    return prepareEvent(options, event, hint, currentScope, this, isolationScope).then((evt) => {
      var _a;
      if (evt === null) {
        return evt;
      }
      this.emit("postprocessEvent", evt, hint);
      evt.contexts = {
        trace: { ...(_a = evt.contexts) == null ? void 0 : _a.trace, ...getTraceContextFromScope(currentScope) },
        ...evt.contexts
      };
      const dynamicSamplingContext = getDynamicSamplingContextFromScope(this, currentScope);
      evt.sdkProcessingMetadata = {
        dynamicSamplingContext,
        ...evt.sdkProcessingMetadata
      };
      return evt;
    });
  }
  /**
   * Processes the event and logs an error in case of rejection
   * @param event
   * @param hint
   * @param scope
   */
  _captureEvent(event, hint = {}, currentScope = getCurrentScope(), isolationScope = getIsolationScope()) {
    if (DEBUG_BUILD$2 && isErrorEvent(event)) {
      debug.log(`Captured error event \`${getPossibleEventMessages(event)[0] || "<unknown>"}\``);
    }
    return this._processEvent(event, hint, currentScope, isolationScope).then(
      (finalEvent) => {
        return finalEvent.event_id;
      },
      (reason) => {
        if (DEBUG_BUILD$2) {
          if (_isDoNotSendEventError(reason)) {
            debug.log(reason.message);
          } else if (_isInternalError(reason)) {
            debug.warn(reason.message);
          } else {
            debug.warn(reason);
          }
        }
        return void 0;
      }
    );
  }
  /**
   * Processes an event (either error or message) and sends it to Sentry.
   *
   * This also adds breadcrumbs and context information to the event. However,
   * platform specific meta data (such as the User's IP address) must be added
   * by the SDK implementor.
   *
   *
   * @param event The event to send to Sentry.
   * @param hint May contain additional information about the original exception.
   * @param currentScope A scope containing event metadata.
   * @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
   */
  _processEvent(event, hint, currentScope, isolationScope) {
    const options = this.getOptions();
    const { sampleRate } = options;
    const isTransaction = isTransactionEvent(event);
    const isError2 = isErrorEvent(event);
    const eventType = event.type || "error";
    const beforeSendLabel = `before send for type \`${eventType}\``;
    const parsedSampleRate = typeof sampleRate === "undefined" ? void 0 : parseSampleRate(sampleRate);
    if (isError2 && typeof parsedSampleRate === "number" && safeMathRandom() > parsedSampleRate) {
      this.recordDroppedEvent("sample_rate", "error");
      return rejectedSyncPromise(
        _makeDoNotSendEventError(
          `Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`
        )
      );
    }
    const dataCategory = getDataCategoryByType(event.type);
    return this._prepareEvent(event, hint, currentScope, isolationScope).then((prepared) => {
      var _a;
      if (prepared === null) {
        this.recordDroppedEvent("event_processor", dataCategory);
        throw _makeDoNotSendEventError("An event processor returned `null`, will not send event.");
      }
      const isInternalException = ((_a = hint.data) == null ? void 0 : _a.__sentry__) === true;
      if (isInternalException) {
        return prepared;
      }
      const result = processBeforeSend(this, options, prepared, hint);
      return _validateBeforeSendResult(result, beforeSendLabel);
    }).then((processedEvent) => {
      var _a;
      if (processedEvent === null) {
        this.recordDroppedEvent("before_send", dataCategory);
        if (isTransaction) {
          const spans = event.spans || [];
          const spanCount = 1 + spans.length;
          this.recordDroppedEvent("before_send", "span", spanCount);
        }
        throw _makeDoNotSendEventError(`${beforeSendLabel} returned \`null\`, will not send event.`);
      }
      const session = currentScope.getSession() || isolationScope.getSession();
      if (isError2 && session) {
        this._updateSessionFromEvent(session, processedEvent);
      }
      if (isTransaction) {
        const spanCountBefore = ((_a = processedEvent.sdkProcessingMetadata) == null ? void 0 : _a.spanCountBeforeProcessing) || 0;
        const spanCountAfter = processedEvent.spans ? processedEvent.spans.length : 0;
        const droppedSpanCount = spanCountBefore - spanCountAfter;
        if (droppedSpanCount > 0) {
          this.recordDroppedEvent("before_send", "span", droppedSpanCount);
        }
      }
      const transactionInfo = processedEvent.transaction_info;
      if (isTransaction && transactionInfo && processedEvent.transaction !== event.transaction) {
        const source = "custom";
        processedEvent.transaction_info = {
          ...transactionInfo,
          source
        };
      }
      this.sendEvent(processedEvent, hint);
      return processedEvent;
    }).then(null, (reason) => {
      if (_isDoNotSendEventError(reason) || _isInternalError(reason)) {
        throw reason;
      }
      this.captureException(reason, {
        mechanism: {
          handled: false,
          type: "internal"
        },
        data: {
          __sentry__: true
        },
        originalException: reason
      });
      throw _makeInternalError(
        `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.
Reason: ${reason}`
      );
    });
  }
  /**
   * Occupies the client with processing and event
   */
  _process(taskProducer, dataCategory) {
    this._numProcessing++;
    void this._promiseBuffer.add(taskProducer).then(
      (value) => {
        this._numProcessing--;
        return value;
      },
      (reason) => {
        this._numProcessing--;
        if (reason === SENTRY_BUFFER_FULL_ERROR) {
          this.recordDroppedEvent("queue_overflow", dataCategory);
        }
        return reason;
      }
    );
  }
  /**
   * Clears outcomes on this client and returns them.
   */
  _clearOutcomes() {
    const outcomes = this._outcomes;
    this._outcomes = {};
    return Object.entries(outcomes).map(([key, quantity]) => {
      const [reason, category] = key.split(":");
      return {
        reason,
        category,
        quantity
      };
    });
  }
  /**
   * Sends client reports as an envelope.
   */
  _flushOutcomes() {
    DEBUG_BUILD$2 && debug.log("Flushing outcomes...");
    const outcomes = this._clearOutcomes();
    if (outcomes.length === 0) {
      DEBUG_BUILD$2 && debug.log("No outcomes to send");
      return;
    }
    if (!this._dsn) {
      DEBUG_BUILD$2 && debug.log("No dsn provided, will not send outcomes");
      return;
    }
    DEBUG_BUILD$2 && debug.log("Sending outcomes:", outcomes);
    const envelope = createClientReportEnvelope(outcomes, this._options.tunnel && dsnToString(this._dsn));
    this.sendEnvelope(envelope);
  }
  /**
   * Creates an {@link Event} from all inputs to `captureException` and non-primitive inputs to `captureMessage`.
   */
}
function getDataCategoryByType(type) {
  return type === "replay_event" ? "replay" : type || "error";
}
function _validateBeforeSendResult(beforeSendResult, beforeSendLabel) {
  const invalidValueError = `${beforeSendLabel} must return \`null\` or a valid event.`;
  if (isThenable(beforeSendResult)) {
    return beforeSendResult.then(
      (event) => {
        if (!isPlainObject(event) && event !== null) {
          throw _makeInternalError(invalidValueError);
        }
        return event;
      },
      (e) => {
        throw _makeInternalError(`${beforeSendLabel} rejected with ${e}`);
      }
    );
  } else if (!isPlainObject(beforeSendResult) && beforeSendResult !== null) {
    throw _makeInternalError(invalidValueError);
  }
  return beforeSendResult;
}
function processBeforeSend(client2, options, event, hint) {
  const { beforeSend, beforeSendTransaction, ignoreSpans } = options;
  const beforeSendSpan = !isStreamedBeforeSendSpanCallback(options.beforeSendSpan) && options.beforeSendSpan;
  let processedEvent = event;
  if (isErrorEvent(processedEvent) && beforeSend) {
    return beforeSend(processedEvent, hint);
  }
  if (isTransactionEvent(processedEvent)) {
    if (beforeSendSpan || ignoreSpans) {
      const rootSpanJson = convertTransactionEventToSpanJson(processedEvent);
      if ((ignoreSpans == null ? void 0 : ignoreSpans.length) && shouldIgnoreSpan(rootSpanJson, ignoreSpans)) {
        return null;
      }
      if (beforeSendSpan) {
        const processedRootSpanJson = beforeSendSpan(rootSpanJson);
        if (!processedRootSpanJson) {
          showSpanDropWarning();
        } else {
          processedEvent = merge(event, convertSpanJsonToTransactionEvent(processedRootSpanJson));
        }
      }
      if (processedEvent.spans) {
        const processedSpans = [];
        const initialSpans = processedEvent.spans;
        for (const span of initialSpans) {
          if ((ignoreSpans == null ? void 0 : ignoreSpans.length) && shouldIgnoreSpan(span, ignoreSpans)) {
            reparentChildSpans(initialSpans, span);
            continue;
          }
          if (beforeSendSpan) {
            const processedSpan = beforeSendSpan(span);
            if (!processedSpan) {
              showSpanDropWarning();
              processedSpans.push(span);
            } else {
              processedSpans.push(processedSpan);
            }
          } else {
            processedSpans.push(span);
          }
        }
        const droppedSpans = processedEvent.spans.length - processedSpans.length;
        if (droppedSpans) {
          client2.recordDroppedEvent("before_send", "span", droppedSpans);
        }
        processedEvent.spans = processedSpans;
      }
    }
    if (beforeSendTransaction) {
      if (processedEvent.spans) {
        const spanCountBefore = processedEvent.spans.length;
        processedEvent.sdkProcessingMetadata = {
          ...event.sdkProcessingMetadata,
          spanCountBeforeProcessing: spanCountBefore
        };
      }
      return beforeSendTransaction(processedEvent, hint);
    }
  }
  return processedEvent;
}
function isErrorEvent(event) {
  return event.type === void 0;
}
function isTransactionEvent(event) {
  return event.type === "transaction";
}
function estimateMetricSizeInBytes(metric) {
  let weight = 0;
  if (metric.name) {
    weight += metric.name.length * 2;
  }
  weight += 8;
  return weight + estimateAttributesSizeInBytes(metric.attributes);
}
function estimateLogSizeInBytes(log2) {
  let weight = 0;
  if (log2.message) {
    weight += log2.message.length * 2;
  }
  return weight + estimateAttributesSizeInBytes(log2.attributes);
}
function estimateAttributesSizeInBytes(attributes) {
  if (!attributes) {
    return 0;
  }
  let weight = 0;
  Object.values(attributes).forEach((value) => {
    if (Array.isArray(value)) {
      weight += value.length * estimatePrimitiveSizeInBytes(value[0]);
    } else if (isPrimitive(value)) {
      weight += estimatePrimitiveSizeInBytes(value);
    } else {
      weight += 100;
    }
  });
  return weight;
}
function estimatePrimitiveSizeInBytes(value) {
  if (typeof value === "string") {
    return value.length * 2;
  } else if (typeof value === "number") {
    return 8;
  } else if (typeof value === "boolean") {
    return 4;
  }
  return 0;
}
function hasSentryFetchUrlHost(error2) {
  return isError(error2) && "__sentry_fetch_url_host__" in error2 && typeof error2.__sentry_fetch_url_host__ === "string";
}
function _enhanceErrorWithSentryInfo(error2) {
  if (hasSentryFetchUrlHost(error2)) {
    return `${error2.message} (${error2.__sentry_fetch_url_host__})`;
  }
  return error2.message;
}
function parseUrl(url) {
  if (!url) {
    return {};
  }
  const match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
  if (!match) {
    return {};
  }
  const query = match[6] || "";
  const fragment = match[8] || "";
  return {
    host: match[4],
    path: match[5],
    protocol: match[2],
    search: query,
    hash: fragment,
    relative: match[5] + query + fragment
    // everything minus origin
  };
}
function stripDataUrlContent(url, includeDataPrefix = true) {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)/);
    const mimeType = match ? match[1] : "text/plain";
    const isBase64 = url.includes(";base64,");
    const dataStart = url.indexOf(",");
    let dataPrefix = "";
    if (includeDataPrefix && dataStart !== -1) {
      const data = url.slice(dataStart + 1);
      dataPrefix = data.length > 10 ? `${data.slice(0, 10)}... [truncated]` : data;
    }
    return `data:${mimeType}${isBase64 ? ",base64" : ""}${dataPrefix ? `,${dataPrefix}` : ""}`;
  }
  return url;
}
function addAutoIpAddressToSession(session) {
  var _a;
  if ("aggregates" in session) {
    if (((_a = session.attrs) == null ? void 0 : _a["ip_address"]) === void 0) {
      session.attrs = {
        ...session.attrs,
        ip_address: "{{auto}}"
      };
    }
  } else {
    if (session.ipAddress === void 0) {
      session.ipAddress = "{{auto}}";
    }
  }
}
function applySdkMetadata(options, name, names = [name], source = "npm") {
  const sdk = (options._metadata = options._metadata || {}).sdk = options._metadata.sdk || {};
  if (!sdk.name) {
    sdk.name = `sentry.javascript.${name}`;
    sdk.packages = names.map((name2) => ({
      name: `${source}:@sentry/${name2}`,
      version: SDK_VERSION
    }));
    sdk.version = SDK_VERSION;
  }
}
const DEFAULT_BREADCRUMBS = 100;
function addBreadcrumb(breadcrumb, hint) {
  const client2 = getClient();
  const isolationScope = getIsolationScope();
  if (!client2) return;
  const { beforeBreadcrumb = null, maxBreadcrumbs = DEFAULT_BREADCRUMBS } = client2.getOptions();
  if (maxBreadcrumbs <= 0) return;
  const timestamp = dateTimestampInSeconds();
  const mergedBreadcrumb = { timestamp, ...breadcrumb };
  const finalBreadcrumb = beforeBreadcrumb ? consoleSandbox(() => beforeBreadcrumb(mergedBreadcrumb, hint)) : mergedBreadcrumb;
  if (finalBreadcrumb === null) return;
  if (client2.emit) {
    client2.emit("beforeAddBreadcrumb", finalBreadcrumb, hint);
  }
  isolationScope.addBreadcrumb(finalBreadcrumb, maxBreadcrumbs);
}
let originalFunctionToString;
const INTEGRATION_NAME$8 = "FunctionToString";
const SETUP_CLIENTS = /* @__PURE__ */ new WeakMap();
const _functionToStringIntegration = () => {
  return {
    name: INTEGRATION_NAME$8,
    setupOnce() {
      originalFunctionToString = Function.prototype.toString;
      try {
        Function.prototype.toString = function(...args) {
          const originalFunction = getOriginalFunction(this);
          const context = SETUP_CLIENTS.has(getClient()) && originalFunction !== void 0 ? originalFunction : this;
          return originalFunctionToString.apply(context, args);
        };
      } catch {
      }
    },
    setup(client2) {
      SETUP_CLIENTS.set(client2, true);
    }
  };
};
const functionToStringIntegration = defineIntegration(_functionToStringIntegration);
const DEFAULT_IGNORE_ERRORS = [
  /^Script error\.?$/,
  /^Javascript error: Script error\.? on line 0$/,
  /^ResizeObserver loop completed with undelivered notifications.$/,
  // The browser logs this when a ResizeObserver handler takes a bit longer. Usually this is not an actual issue though. It indicates slowness.
  /^Cannot redefine property: googletag$/,
  // This is thrown when google tag manager is used in combination with an ad blocker
  /^Can't find variable: gmo$/,
  // Error from Google Search App https://issuetracker.google.com/issues/396043331
  /^undefined is not an object \(evaluating 'a\.[A-Z]'\)$/,
  // Random error that happens but not actionable or noticeable to end-users.
  /can't redefine non-configurable property "solana"/,
  // Probably a browser extension or custom browser (Brave) throwing this error
  /vv\(\)\.getRestrictions is not a function/,
  // Error thrown by GTM, seemingly not affecting end-users
  /Can't find variable: _AutofillCallbackHandler/,
  // Unactionable error in instagram webview https://developers.facebook.com/community/threads/320013549791141/
  /Object Not Found Matching Id:\d+, MethodName:simulateEvent/,
  // unactionable error from CEFSharp, a .NET library that embeds chromium in .NET apps
  /^Java exception was raised during method invocation$/
  // error from Facebook Mobile browser (https://github.com/getsentry/sentry-javascript/issues/15065)
];
const INTEGRATION_NAME$7 = "EventFilters";
const eventFiltersIntegration = defineIntegration((options = {}) => {
  let mergedOptions;
  return {
    name: INTEGRATION_NAME$7,
    setup(client2) {
      const clientOptions = client2.getOptions();
      mergedOptions = _mergeOptions(options, clientOptions);
    },
    processEvent(event, _hint, client2) {
      if (!mergedOptions) {
        const clientOptions = client2.getOptions();
        mergedOptions = _mergeOptions(options, clientOptions);
      }
      return _shouldDropEvent$1(event, mergedOptions) ? null : event;
    }
  };
});
const inboundFiltersIntegration = defineIntegration((options = {}) => {
  return {
    ...eventFiltersIntegration(options),
    name: "InboundFilters"
  };
});
function _mergeOptions(internalOptions = {}, clientOptions = {}) {
  return {
    allowUrls: [...internalOptions.allowUrls || [], ...clientOptions.allowUrls || []],
    denyUrls: [...internalOptions.denyUrls || [], ...clientOptions.denyUrls || []],
    ignoreErrors: [
      ...internalOptions.ignoreErrors || [],
      ...clientOptions.ignoreErrors || [],
      ...internalOptions.disableErrorDefaults ? [] : DEFAULT_IGNORE_ERRORS
    ],
    ignoreTransactions: [...internalOptions.ignoreTransactions || [], ...clientOptions.ignoreTransactions || []]
  };
}
function _shouldDropEvent$1(event, options) {
  if (!event.type) {
    if (_isIgnoredError(event, options.ignoreErrors)) {
      DEBUG_BUILD$2 && debug.warn(
        `Event dropped due to being matched by \`ignoreErrors\` option.
Event: ${getEventDescription(event)}`
      );
      return true;
    }
    if (_isUselessError(event)) {
      DEBUG_BUILD$2 && debug.warn(
        `Event dropped due to not having an error message, error type or stacktrace.
Event: ${getEventDescription(
          event
        )}`
      );
      return true;
    }
    if (_isDeniedUrl(event, options.denyUrls)) {
      DEBUG_BUILD$2 && debug.warn(
        `Event dropped due to being matched by \`denyUrls\` option.
Event: ${getEventDescription(
          event
        )}.
Url: ${_getEventFilterUrl(event)}`
      );
      return true;
    }
    if (!_isAllowedUrl(event, options.allowUrls)) {
      DEBUG_BUILD$2 && debug.warn(
        `Event dropped due to not being matched by \`allowUrls\` option.
Event: ${getEventDescription(
          event
        )}.
Url: ${_getEventFilterUrl(event)}`
      );
      return true;
    }
  } else if (event.type === "transaction") {
    if (_isIgnoredTransaction(event, options.ignoreTransactions)) {
      DEBUG_BUILD$2 && debug.warn(
        `Event dropped due to being matched by \`ignoreTransactions\` option.
Event: ${getEventDescription(event)}`
      );
      return true;
    }
  }
  return false;
}
function _isIgnoredError(event, ignoreErrors) {
  if (!(ignoreErrors == null ? void 0 : ignoreErrors.length)) {
    return false;
  }
  return getPossibleEventMessages(event).some((message) => stringMatchesSomePattern(message, ignoreErrors));
}
function _isIgnoredTransaction(event, ignoreTransactions) {
  if (!(ignoreTransactions == null ? void 0 : ignoreTransactions.length)) {
    return false;
  }
  const name = event.transaction;
  return name ? stringMatchesSomePattern(name, ignoreTransactions) : false;
}
function _isDeniedUrl(event, denyUrls) {
  if (!(denyUrls == null ? void 0 : denyUrls.length)) {
    return false;
  }
  const url = _getEventFilterUrl(event);
  return !url ? false : stringMatchesSomePattern(url, denyUrls);
}
function _isAllowedUrl(event, allowUrls) {
  if (!(allowUrls == null ? void 0 : allowUrls.length)) {
    return true;
  }
  const url = _getEventFilterUrl(event);
  return !url ? true : stringMatchesSomePattern(url, allowUrls);
}
function _getLastValidUrl(frames = []) {
  for (let i2 = frames.length - 1; i2 >= 0; i2--) {
    const frame = frames[i2];
    if (frame && frame.filename !== "<anonymous>" && frame.filename !== "[native code]") {
      return frame.filename || null;
    }
  }
  return null;
}
function _getEventFilterUrl(event) {
  var _a, _b;
  try {
    const rootException = [...((_a = event.exception) == null ? void 0 : _a.values) ?? []].reverse().find((value) => {
      var _a2, _b2, _c;
      return ((_a2 = value.mechanism) == null ? void 0 : _a2.parent_id) === void 0 && ((_c = (_b2 = value.stacktrace) == null ? void 0 : _b2.frames) == null ? void 0 : _c.length);
    });
    const frames = (_b = rootException == null ? void 0 : rootException.stacktrace) == null ? void 0 : _b.frames;
    return frames ? _getLastValidUrl(frames) : null;
  } catch {
    DEBUG_BUILD$2 && debug.error(`Cannot extract url for event ${getEventDescription(event)}`);
    return null;
  }
}
function _isUselessError(event) {
  var _a, _b;
  if (!((_b = (_a = event.exception) == null ? void 0 : _a.values) == null ? void 0 : _b.length)) {
    return false;
  }
  return (
    // No top-level message
    !event.message && // There are no exception values that have a stacktrace, a non-generic-Error type or value
    !event.exception.values.some((value) => value.stacktrace || value.type && value.type !== "Error" || value.value)
  );
}
function applyAggregateErrorsToEvent(exceptionFromErrorImplementation, parser, key, limit, event, hint) {
  var _a;
  if (!((_a = event.exception) == null ? void 0 : _a.values) || !hint || !isInstanceOf(hint.originalException, Error)) {
    return;
  }
  const originalException = event.exception.values.length > 0 ? event.exception.values[event.exception.values.length - 1] : void 0;
  if (originalException) {
    event.exception.values = aggregateExceptionsFromError(
      exceptionFromErrorImplementation,
      parser,
      limit,
      hint.originalException,
      key,
      event.exception.values,
      originalException,
      0
    );
  }
}
function aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, error2, key, prevExceptions, exception, exceptionId) {
  if (prevExceptions.length >= limit + 1) {
    return prevExceptions;
  }
  let newExceptions = [...prevExceptions];
  if (isInstanceOf(error2[key], Error)) {
    applyExceptionGroupFieldsForParentException(exception, exceptionId, error2);
    const newException = exceptionFromErrorImplementation(parser, error2[key]);
    const newExceptionId = newExceptions.length;
    applyExceptionGroupFieldsForChildException(newException, key, newExceptionId, exceptionId);
    newExceptions = aggregateExceptionsFromError(
      exceptionFromErrorImplementation,
      parser,
      limit,
      error2[key],
      key,
      [newException, ...newExceptions],
      newException,
      newExceptionId
    );
  }
  if (isExceptionGroup(error2)) {
    error2.errors.forEach((childError, i2) => {
      if (isInstanceOf(childError, Error)) {
        applyExceptionGroupFieldsForParentException(exception, exceptionId, error2);
        const newException = exceptionFromErrorImplementation(parser, childError);
        const newExceptionId = newExceptions.length;
        applyExceptionGroupFieldsForChildException(newException, `errors[${i2}]`, newExceptionId, exceptionId);
        newExceptions = aggregateExceptionsFromError(
          exceptionFromErrorImplementation,
          parser,
          limit,
          childError,
          key,
          [newException, ...newExceptions],
          newException,
          newExceptionId
        );
      }
    });
  }
  return newExceptions;
}
function isExceptionGroup(error2) {
  return Array.isArray(error2.errors);
}
function applyExceptionGroupFieldsForParentException(exception, exceptionId, error2) {
  exception.mechanism = {
    handled: true,
    type: "auto.core.linked_errors",
    ...isExceptionGroup(error2) && { is_exception_group: true },
    ...exception.mechanism,
    exception_id: exceptionId
  };
}
function applyExceptionGroupFieldsForChildException(exception, source, exceptionId, parentId) {
  exception.mechanism = {
    handled: true,
    ...exception.mechanism,
    type: "chained",
    source,
    exception_id: exceptionId,
    parent_id: parentId
  };
}
function addConsoleInstrumentationHandler(handler) {
  const type = "console";
  addHandler(type, handler);
  maybeInstrument(type, instrumentConsole);
}
function instrumentConsole() {
  if (!("console" in GLOBAL_OBJ)) {
    return;
  }
  CONSOLE_LEVELS.forEach(function(level) {
    if (!(level in GLOBAL_OBJ.console)) {
      return;
    }
    fill(GLOBAL_OBJ.console, level, function(originalConsoleMethod) {
      originalConsoleMethods[level] = originalConsoleMethod;
      return function(...args) {
        const handlerData = { args, level };
        triggerHandlers("console", handlerData);
        const log2 = originalConsoleMethods[level];
        log2 == null ? void 0 : log2.apply(GLOBAL_OBJ.console, args);
      };
    });
  });
}
function severityLevelFromString(level) {
  return level === "warn" ? "warning" : ["fatal", "error", "warning", "log", "info", "debug"].includes(level) ? level : "log";
}
const INTEGRATION_NAME$6 = "Dedupe";
const _dedupeIntegration = () => {
  let previousEvent;
  return {
    name: INTEGRATION_NAME$6,
    processEvent(currentEvent) {
      if (currentEvent.type) {
        return currentEvent;
      }
      try {
        if (_shouldDropEvent(currentEvent, previousEvent)) {
          DEBUG_BUILD$2 && debug.warn("Event dropped due to being a duplicate of previously captured event.");
          return null;
        }
      } catch {
      }
      return previousEvent = currentEvent;
    }
  };
};
const dedupeIntegration = defineIntegration(_dedupeIntegration);
function _shouldDropEvent(currentEvent, previousEvent) {
  if (!previousEvent) {
    return false;
  }
  if (_isSameMessageEvent(currentEvent, previousEvent)) {
    return true;
  }
  if (_isSameExceptionEvent(currentEvent, previousEvent)) {
    return true;
  }
  return false;
}
function _isSameMessageEvent(currentEvent, previousEvent) {
  const currentMessage = currentEvent.message;
  const previousMessage = previousEvent.message;
  if (!currentMessage && !previousMessage) {
    return false;
  }
  if (currentMessage && !previousMessage || !currentMessage && previousMessage) {
    return false;
  }
  if (currentMessage !== previousMessage) {
    return false;
  }
  if (!_isSameFingerprint(currentEvent, previousEvent)) {
    return false;
  }
  if (!_isSameStacktrace(currentEvent, previousEvent)) {
    return false;
  }
  return true;
}
function _isSameExceptionEvent(currentEvent, previousEvent) {
  const previousException = _getExceptionFromEvent(previousEvent);
  const currentException = _getExceptionFromEvent(currentEvent);
  if (!previousException || !currentException) {
    return false;
  }
  if (previousException.type !== currentException.type || previousException.value !== currentException.value) {
    return false;
  }
  if (!_isSameFingerprint(currentEvent, previousEvent)) {
    return false;
  }
  if (!_isSameStacktrace(currentEvent, previousEvent)) {
    return false;
  }
  return true;
}
function _isSameStacktrace(currentEvent, previousEvent) {
  let currentFrames = getFramesFromEvent(currentEvent);
  let previousFrames = getFramesFromEvent(previousEvent);
  if (!currentFrames && !previousFrames) {
    return true;
  }
  if (currentFrames && !previousFrames || !currentFrames && previousFrames) {
    return false;
  }
  currentFrames = currentFrames;
  previousFrames = previousFrames;
  if (previousFrames.length !== currentFrames.length) {
    return false;
  }
  for (let i2 = 0; i2 < previousFrames.length; i2++) {
    const frameA = previousFrames[i2];
    const frameB = currentFrames[i2];
    if (frameA.filename !== frameB.filename || frameA.lineno !== frameB.lineno || frameA.colno !== frameB.colno || frameA.function !== frameB.function) {
      return false;
    }
  }
  return true;
}
function _isSameFingerprint(currentEvent, previousEvent) {
  let currentFingerprint = currentEvent.fingerprint;
  let previousFingerprint = previousEvent.fingerprint;
  if (!currentFingerprint && !previousFingerprint) {
    return true;
  }
  if (currentFingerprint && !previousFingerprint || !currentFingerprint && previousFingerprint) {
    return false;
  }
  currentFingerprint = currentFingerprint;
  previousFingerprint = previousFingerprint;
  try {
    return !!(currentFingerprint.join("") === previousFingerprint.join(""));
  } catch {
    return false;
  }
}
function _getExceptionFromEvent(event) {
  var _a, _b;
  return (_b = (_a = event.exception) == null ? void 0 : _a.values) == null ? void 0 : _b[0];
}
const INTEGRATION_NAME$5 = "ConversationId";
const _conversationIdIntegration = () => {
  return {
    name: INTEGRATION_NAME$5,
    setup(client2) {
      client2.on("spanStart", (span) => {
        const scopeData = getCurrentScope().getScopeData();
        const isolationScopeData = getIsolationScope().getScopeData();
        const conversationId = scopeData.conversationId || isolationScopeData.conversationId;
        if (conversationId) {
          span.setAttribute(GEN_AI_CONVERSATION_ID_ATTRIBUTE, conversationId);
        }
      });
    }
  };
};
const conversationIdIntegration = defineIntegration(_conversationIdIntegration);
function getBreadcrumbLogLevelFromHttpStatusCode(statusCode) {
  if (statusCode === void 0) {
    return void 0;
  } else if (statusCode >= 400 && statusCode < 500) {
    return "warning";
  } else if (statusCode >= 500) {
    return "error";
  } else {
    return void 0;
  }
}
const WINDOW$3 = GLOBAL_OBJ;
function supportsHistory() {
  return "history" in WINDOW$3 && !!WINDOW$3.history;
}
function _isFetchSupported() {
  if (!("fetch" in WINDOW$3)) {
    return false;
  }
  try {
    new Headers();
    new Request("data:,");
    new Response();
    return true;
  } catch {
    return false;
  }
}
function isNativeFunction(func) {
  return func && /^function\s+\w+\(\)\s+\{\s+\[native code\]\s+\}$/.test(func.toString());
}
function supportsNativeFetch() {
  var _a;
  if (typeof EdgeRuntime === "string") {
    return true;
  }
  if (!_isFetchSupported()) {
    return false;
  }
  if (isNativeFunction(WINDOW$3.fetch)) {
    return true;
  }
  let result = false;
  const doc = WINDOW$3.document;
  if (doc && typeof doc.createElement === "function") {
    try {
      const sandbox = doc.createElement("iframe");
      sandbox.hidden = true;
      doc.head.appendChild(sandbox);
      if ((_a = sandbox.contentWindow) == null ? void 0 : _a.fetch) {
        result = isNativeFunction(sandbox.contentWindow.fetch);
      }
      doc.head.removeChild(sandbox);
    } catch (err) {
      DEBUG_BUILD$2 && debug.warn("Could not create sandbox iframe for pure fetch check, bailing to window.fetch: ", err);
    }
  }
  return result;
}
function addFetchInstrumentationHandler(handler, skipNativeFetchCheck) {
  const type = "fetch";
  addHandler(type, handler);
  maybeInstrument(type, () => instrumentFetch(void 0, skipNativeFetchCheck));
}
function instrumentFetch(onFetchResolved, skipNativeFetchCheck = false) {
  if (skipNativeFetchCheck && !supportsNativeFetch()) {
    return;
  }
  fill(GLOBAL_OBJ, "fetch", function(originalFetch) {
    return function(...args) {
      const virtualError = new Error();
      const { method, url } = parseFetchArgs(args);
      const handlerData = {
        args,
        fetchData: {
          method,
          url
        },
        startTimestamp: timestampInSeconds() * 1e3,
        // // Adding the error to be able to fingerprint the failed fetch event in HttpClient instrumentation
        virtualError,
        headers: getHeadersFromFetchArgs(args)
      };
      {
        triggerHandlers("fetch", {
          ...handlerData
        });
      }
      return originalFetch.apply(GLOBAL_OBJ, args).then(
        async (response) => {
          {
            triggerHandlers("fetch", {
              ...handlerData,
              endTimestamp: timestampInSeconds() * 1e3,
              response
            });
          }
          return response;
        },
        (error2) => {
          triggerHandlers("fetch", {
            ...handlerData,
            endTimestamp: timestampInSeconds() * 1e3,
            error: error2
          });
          if (isError(error2) && error2.stack === void 0) {
            error2.stack = virtualError.stack;
            addNonEnumerableProperty(error2, "framesToPop", 1);
          }
          const client2 = getClient();
          const enhanceOption = (client2 == null ? void 0 : client2.getOptions().enhanceFetchErrorMessages) ?? "always";
          const shouldEnhance = enhanceOption !== false;
          if (shouldEnhance && error2 instanceof TypeError && (error2.message === "Failed to fetch" || error2.message === "Load failed" || error2.message === "NetworkError when attempting to fetch resource.")) {
            try {
              const url2 = new URL(handlerData.fetchData.url);
              const hostname = url2.host;
              if (enhanceOption === "always") {
                error2.message = `${error2.message} (${hostname})`;
              } else {
                addNonEnumerableProperty(error2, "__sentry_fetch_url_host__", hostname);
              }
            } catch {
            }
          }
          throw error2;
        }
      );
    };
  });
}
function hasProp(obj, prop) {
  return !!obj && typeof obj === "object" && !!obj[prop];
}
function getUrlFromResource(resource) {
  if (typeof resource === "string") {
    return resource;
  }
  if (!resource) {
    return "";
  }
  if (hasProp(resource, "url")) {
    return resource.url;
  }
  if (resource.toString) {
    return resource.toString();
  }
  return "";
}
function parseFetchArgs(fetchArgs) {
  if (fetchArgs.length === 0) {
    return { method: "GET", url: "" };
  }
  if (fetchArgs.length === 2) {
    const [resource, options] = fetchArgs;
    return {
      url: getUrlFromResource(resource),
      method: hasProp(options, "method") ? String(options.method).toUpperCase() : (
        // Request object as first argument
        isRequest(resource) && hasProp(resource, "method") ? String(resource.method).toUpperCase() : "GET"
      )
    };
  }
  const arg = fetchArgs[0];
  return {
    url: getUrlFromResource(arg),
    method: hasProp(arg, "method") ? String(arg.method).toUpperCase() : "GET"
  };
}
function getHeadersFromFetchArgs(fetchArgs) {
  const [requestArgument, optionsArgument] = fetchArgs;
  try {
    if (typeof optionsArgument === "object" && optionsArgument !== null && "headers" in optionsArgument && optionsArgument.headers) {
      return new Headers(optionsArgument.headers);
    }
    if (isRequest(requestArgument)) {
      return new Headers(requestArgument.headers);
    }
  } catch {
  }
  return;
}
function getSDKSource() {
  return "npm";
}
const WINDOW$2 = GLOBAL_OBJ;
let ignoreOnError = 0;
function shouldIgnoreOnError() {
  return ignoreOnError > 0;
}
function ignoreNextOnError() {
  ignoreOnError++;
  setTimeout(() => {
    ignoreOnError--;
  });
}
function wrap(fn, options = {}) {
  function isFunction(fn2) {
    return typeof fn2 === "function";
  }
  if (!isFunction(fn)) {
    return fn;
  }
  try {
    const wrapper = fn.__sentry_wrapped__;
    if (wrapper) {
      if (typeof wrapper === "function") {
        return wrapper;
      } else {
        return fn;
      }
    }
    if (getOriginalFunction(fn)) {
      return fn;
    }
  } catch {
    return fn;
  }
  const sentryWrapped = function(...args) {
    try {
      const wrappedArguments = args.map((arg) => wrap(arg, options));
      return fn.apply(this, wrappedArguments);
    } catch (ex) {
      ignoreNextOnError();
      withScope((scope2) => {
        scope2.addEventProcessor((event) => {
          if (options.mechanism) {
            addExceptionTypeValue(event, void 0);
            addExceptionMechanism(event, options.mechanism);
          }
          event.extra = {
            ...event.extra,
            arguments: args
          };
          return event;
        });
        captureException(ex);
      });
      throw ex;
    }
  };
  try {
    for (const property in fn) {
      if (Object.prototype.hasOwnProperty.call(fn, property)) {
        sentryWrapped[property] = fn[property];
      }
    }
  } catch {
  }
  markFunctionWrapped(sentryWrapped, fn);
  addNonEnumerableProperty(fn, "__sentry_wrapped__", sentryWrapped);
  try {
    const descriptor = Object.getOwnPropertyDescriptor(sentryWrapped, "name");
    if (descriptor.configurable) {
      Object.defineProperty(sentryWrapped, "name", {
        get() {
          return fn.name;
        }
      });
    }
  } catch {
  }
  return sentryWrapped;
}
function getHttpRequestData() {
  const url = getLocationHref();
  const { referrer } = WINDOW$2.document || {};
  const { userAgent: userAgent2 } = WINDOW$2.navigator || {};
  const headers = {
    ...referrer && { Referer: referrer },
    ...userAgent2 && { "User-Agent": userAgent2 }
  };
  const request = {
    url,
    headers
  };
  return request;
}
function exceptionFromError(stackParser, ex) {
  const frames = parseStackFrames(stackParser, ex);
  const exception = {
    type: extractType(ex),
    value: extractMessage(ex)
  };
  if (frames.length) {
    exception.stacktrace = { frames };
  }
  if (exception.type === void 0 && exception.value === "") {
    exception.value = "Unrecoverable error caught";
  }
  return exception;
}
function eventFromPlainObject(stackParser, exception, syntheticException, isUnhandledRejection) {
  const client2 = getClient();
  const normalizeDepth = client2 == null ? void 0 : client2.getOptions().normalizeDepth;
  const errorFromProp = getErrorPropertyFromObject(exception);
  const extra = {
    __serialized__: normalizeToSize(exception, normalizeDepth)
  };
  if (errorFromProp) {
    return {
      exception: {
        values: [exceptionFromError(stackParser, errorFromProp)]
      },
      extra
    };
  }
  const event = {
    exception: {
      values: [
        {
          type: isEvent(exception) ? exception.constructor.name : isUnhandledRejection ? "UnhandledRejection" : "Error",
          value: getNonErrorObjectExceptionValue(exception, { isUnhandledRejection })
        }
      ]
    },
    extra
  };
  if (syntheticException) {
    const frames = parseStackFrames(stackParser, syntheticException);
    if (frames.length) {
      event.exception.values[0].stacktrace = { frames };
    }
  }
  return event;
}
function eventFromError(stackParser, ex) {
  return {
    exception: {
      values: [exceptionFromError(stackParser, ex)]
    }
  };
}
function parseStackFrames(stackParser, ex) {
  const stacktrace = ex.stacktrace || ex.stack || "";
  const skipLines = getSkipFirstStackStringLines(ex);
  const framesToPop = getPopFirstTopFrames(ex);
  try {
    return stackParser(stacktrace, skipLines, framesToPop);
  } catch {
  }
  return [];
}
const reactMinifiedRegexp = /Minified React error #\d+;/i;
function getSkipFirstStackStringLines(ex) {
  if (ex && reactMinifiedRegexp.test(ex.message)) {
    return 1;
  }
  return 0;
}
function getPopFirstTopFrames(ex) {
  if (typeof ex.framesToPop === "number") {
    return ex.framesToPop;
  }
  return 0;
}
function isWebAssemblyException(exception) {
  if (typeof WebAssembly !== "undefined" && typeof WebAssembly.Exception !== "undefined") {
    return exception instanceof WebAssembly.Exception;
  } else {
    return false;
  }
}
function extractType(ex) {
  const name = ex == null ? void 0 : ex.name;
  if (!name && isWebAssemblyException(ex)) {
    const hasTypeInMessage = ex.message && Array.isArray(ex.message) && ex.message.length == 2;
    return hasTypeInMessage ? ex.message[0] : "WebAssembly.Exception";
  }
  return name;
}
function extractMessage(ex) {
  const message = ex == null ? void 0 : ex.message;
  if (isWebAssemblyException(ex)) {
    if (Array.isArray(ex.message) && ex.message.length == 2) {
      return ex.message[1];
    }
    return "wasm exception";
  }
  if (!message) {
    return "No error message";
  }
  if (message.error && typeof message.error.message === "string") {
    return _enhanceErrorWithSentryInfo(message.error);
  }
  return _enhanceErrorWithSentryInfo(ex);
}
function eventFromException(stackParser, exception, hint, attachStacktrace) {
  const syntheticException = (hint == null ? void 0 : hint.syntheticException) || void 0;
  const event = eventFromUnknownInput(stackParser, exception, syntheticException, attachStacktrace);
  addExceptionMechanism(event);
  event.level = "error";
  if (hint == null ? void 0 : hint.event_id) {
    event.event_id = hint.event_id;
  }
  return resolvedSyncPromise(event);
}
function eventFromMessage(stackParser, message, level = "info", hint, attachStacktrace) {
  const syntheticException = (hint == null ? void 0 : hint.syntheticException) || void 0;
  const event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
  event.level = level;
  if (hint == null ? void 0 : hint.event_id) {
    event.event_id = hint.event_id;
  }
  return resolvedSyncPromise(event);
}
function eventFromUnknownInput(stackParser, exception, syntheticException, attachStacktrace, isUnhandledRejection) {
  let event;
  if (isErrorEvent$1(exception) && exception.error) {
    const errorEvent = exception;
    return eventFromError(stackParser, errorEvent.error);
  }
  if (isDOMError(exception) || isDOMException(exception)) {
    const domException = exception;
    if ("stack" in exception) {
      event = eventFromError(stackParser, exception);
    } else {
      const name = domException.name || (isDOMError(domException) ? "DOMError" : "DOMException");
      const message = domException.message ? `${name}: ${domException.message}` : name;
      event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
      addExceptionTypeValue(event, message);
    }
    if ("code" in domException) {
      event.tags = { ...event.tags, "DOMException.code": `${domException.code}` };
    }
    return event;
  }
  if (isError(exception)) {
    return eventFromError(stackParser, exception);
  }
  if (isPlainObject(exception) || isEvent(exception)) {
    const objectException = exception;
    event = eventFromPlainObject(stackParser, objectException, syntheticException, isUnhandledRejection);
    addExceptionMechanism(event, {
      synthetic: true
    });
    return event;
  }
  event = eventFromString(stackParser, exception, syntheticException, attachStacktrace);
  addExceptionTypeValue(event, `${exception}`);
  addExceptionMechanism(event, {
    synthetic: true
  });
  return event;
}
function eventFromString(stackParser, message, syntheticException, attachStacktrace) {
  const event = {};
  if (attachStacktrace && syntheticException) {
    const frames = parseStackFrames(stackParser, syntheticException);
    if (frames.length) {
      event.exception = {
        values: [{ value: message, stacktrace: { frames } }]
      };
    }
    addExceptionMechanism(event, { synthetic: true });
  }
  if (isParameterizedString(message)) {
    const { __sentry_template_string__, __sentry_template_values__ } = message;
    event.logentry = {
      message: __sentry_template_string__,
      params: __sentry_template_values__
    };
    return event;
  }
  event.message = message;
  return event;
}
function getNonErrorObjectExceptionValue(exception, { isUnhandledRejection }) {
  const keys = extractExceptionKeysForMessage(exception);
  const captureType = isUnhandledRejection ? "promise rejection" : "exception";
  if (isErrorEvent$1(exception)) {
    return `Event \`ErrorEvent\` captured as ${captureType} with message \`${exception.message}\``;
  }
  if (isEvent(exception)) {
    const className = getObjectClassName(exception);
    return `Event \`${className}\` (type=${exception.type}) captured as ${captureType}`;
  }
  return `Object captured as ${captureType} with keys: ${keys}`;
}
function getObjectClassName(obj) {
  try {
    const prototype = Object.getPrototypeOf(obj);
    return prototype ? prototype.constructor.name : void 0;
  } catch {
  }
}
function getErrorPropertyFromObject(obj) {
  return Object.values(obj).find((v2) => v2 instanceof Error);
}
class BrowserClient extends Client {
  /**
   * Creates a new Browser SDK instance.
   *
   * @param options Configuration options for this SDK.
   */
  constructor(options) {
    var _a;
    const opts = applyDefaultOptions(options);
    const sdkSource = WINDOW$2.SENTRY_SDK_SOURCE || getSDKSource();
    applySdkMetadata(opts, "browser", ["browser"], sdkSource);
    if ((_a = opts._metadata) == null ? void 0 : _a.sdk) {
      opts._metadata.sdk.settings = {
        infer_ip: opts.sendDefaultPii ? "auto" : "never",
        // purposefully allowing already passed settings to override the default
        ...opts._metadata.sdk.settings
      };
    }
    super(opts);
    const {
      sendDefaultPii,
      sendClientReports,
      enableLogs,
      _experiments,
      enableMetrics: enableMetricsOption
    } = this._options;
    const enableMetrics = enableMetricsOption ?? (_experiments == null ? void 0 : _experiments.enableMetrics) ?? true;
    if (WINDOW$2.document && (sendClientReports || enableLogs || enableMetrics)) {
      WINDOW$2.document.addEventListener("visibilitychange", () => {
        if (WINDOW$2.document.visibilityState === "hidden") {
          if (sendClientReports) {
            this._flushOutcomes();
          }
          if (enableLogs) {
            _INTERNAL_flushLogsBuffer(this);
          }
          if (enableMetrics) {
            _INTERNAL_flushMetricsBuffer(this);
          }
        }
      });
    }
    if (sendDefaultPii) {
      this.on("beforeSendSession", addAutoIpAddressToSession);
    }
  }
  /**
   * @inheritDoc
   */
  eventFromException(exception, hint) {
    return eventFromException(this._options.stackParser, exception, hint, this._options.attachStacktrace);
  }
  /**
   * @inheritDoc
   */
  eventFromMessage(message, level = "info", hint) {
    return eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace);
  }
  /**
   * @inheritDoc
   */
  _prepareEvent(event, hint, currentScope, isolationScope) {
    event.platform = event.platform || "javascript";
    return super._prepareEvent(event, hint, currentScope, isolationScope);
  }
}
function applyDefaultOptions(optionsArg) {
  var _a;
  return {
    release: typeof __SENTRY_RELEASE__ === "string" ? __SENTRY_RELEASE__ : (_a = WINDOW$2.SENTRY_RELEASE) == null ? void 0 : _a.id,
    // This supports the variable that sentry-webpack-plugin injects
    sendClientReports: true,
    // We default this to true, as it is the safer scenario
    parentSpanIsAlwaysRootSpan: true,
    ...optionsArg
  };
}
const DEBUG_BUILD$1 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const WINDOW$1 = GLOBAL_OBJ;
const DEBOUNCE_DURATION = 1e3;
let debounceTimerID;
let lastCapturedEventType;
let lastCapturedEventTargetId;
function addClickKeypressInstrumentationHandler(handler) {
  const type = "dom";
  addHandler(type, handler);
  maybeInstrument(type, instrumentDOM);
}
function instrumentDOM() {
  if (!WINDOW$1.document) {
    return;
  }
  const triggerDOMHandler = triggerHandlers.bind(null, "dom");
  const globalDOMEventHandler = makeDOMEventHandler(triggerDOMHandler, true);
  WINDOW$1.document.addEventListener("click", globalDOMEventHandler, false);
  WINDOW$1.document.addEventListener("keypress", globalDOMEventHandler, false);
  ["EventTarget", "Node"].forEach((target) => {
    var _a, _b;
    const globalObject = WINDOW$1;
    const proto = (_a = globalObject[target]) == null ? void 0 : _a.prototype;
    if (!((_b = proto == null ? void 0 : proto.hasOwnProperty) == null ? void 0 : _b.call(proto, "addEventListener"))) {
      return;
    }
    fill(proto, "addEventListener", function(originalAddEventListener) {
      return function(type, listener2, options) {
        if (type === "click" || type == "keypress") {
          try {
            const handlers2 = this.__sentry_instrumentation_handlers__ = this.__sentry_instrumentation_handlers__ || {};
            const handlerForType = handlers2[type] = handlers2[type] || { refCount: 0 };
            if (!handlerForType.handler) {
              const handler = makeDOMEventHandler(triggerDOMHandler);
              handlerForType.handler = handler;
              originalAddEventListener.call(this, type, handler, options);
            }
            handlerForType.refCount++;
          } catch {
          }
        }
        return originalAddEventListener.call(this, type, listener2, options);
      };
    });
    fill(
      proto,
      "removeEventListener",
      function(originalRemoveEventListener) {
        return function(type, listener2, options) {
          if (type === "click" || type == "keypress") {
            try {
              const handlers2 = this.__sentry_instrumentation_handlers__ || {};
              const handlerForType = handlers2[type];
              if (handlerForType) {
                handlerForType.refCount--;
                if (handlerForType.refCount <= 0) {
                  originalRemoveEventListener.call(this, type, handlerForType.handler, options);
                  handlerForType.handler = void 0;
                  delete handlers2[type];
                }
                if (Object.keys(handlers2).length === 0) {
                  delete this.__sentry_instrumentation_handlers__;
                }
              }
            } catch {
            }
          }
          return originalRemoveEventListener.call(this, type, listener2, options);
        };
      }
    );
  });
}
function isSimilarToLastCapturedEvent(event) {
  if (event.type !== lastCapturedEventType) {
    return false;
  }
  try {
    if (!event.target || event.target._sentryId !== lastCapturedEventTargetId) {
      return false;
    }
  } catch {
  }
  return true;
}
function shouldSkipDOMEvent(eventType, target) {
  if (eventType !== "keypress") {
    return false;
  }
  if (!(target == null ? void 0 : target.tagName)) {
    return true;
  }
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
    return false;
  }
  return true;
}
function makeDOMEventHandler(handler, globalListener = false) {
  return (event) => {
    if (!event || event["_sentryCaptured"]) {
      return;
    }
    const target = getEventTarget(event);
    if (shouldSkipDOMEvent(event.type, target)) {
      return;
    }
    addNonEnumerableProperty(event, "_sentryCaptured", true);
    if (target && !target._sentryId) {
      addNonEnumerableProperty(target, "_sentryId", uuid4());
    }
    const name = event.type === "keypress" ? "input" : event.type;
    if (!isSimilarToLastCapturedEvent(event)) {
      const handlerData = { event, name, global: globalListener };
      handler(handlerData);
      lastCapturedEventType = event.type;
      lastCapturedEventTargetId = target ? target._sentryId : void 0;
    }
    clearTimeout(debounceTimerID);
    debounceTimerID = WINDOW$1.setTimeout(() => {
      lastCapturedEventTargetId = void 0;
      lastCapturedEventType = void 0;
    }, DEBOUNCE_DURATION);
  };
}
function getEventTarget(event) {
  try {
    return event.target;
  } catch {
    return null;
  }
}
let lastHref;
function addHistoryInstrumentationHandler(handler) {
  const type = "history";
  addHandler(type, handler);
  maybeInstrument(type, instrumentHistory);
}
function instrumentHistory() {
  WINDOW$1.addEventListener("popstate", () => {
    const to = WINDOW$1.location.href;
    const from = lastHref;
    lastHref = to;
    if (from === to) {
      return;
    }
    const handlerData = { from, to };
    triggerHandlers("history", handlerData);
  });
  if (!supportsHistory()) {
    return;
  }
  function historyReplacementFunction(originalHistoryFunction) {
    return function(...args) {
      const url = args.length > 2 ? args[2] : void 0;
      if (url) {
        const from = lastHref;
        const to = getAbsoluteUrl(String(url));
        lastHref = to;
        if (from === to) {
          return originalHistoryFunction.apply(this, args);
        }
        const handlerData = { from, to };
        triggerHandlers("history", handlerData);
      }
      return originalHistoryFunction.apply(this, args);
    };
  }
  fill(WINDOW$1.history, "pushState", historyReplacementFunction);
  fill(WINDOW$1.history, "replaceState", historyReplacementFunction);
}
function getAbsoluteUrl(urlOrPath) {
  try {
    const url = new URL(urlOrPath, WINDOW$1.location.origin);
    return url.toString();
  } catch {
    return urlOrPath;
  }
}
const cachedImplementations = {};
function getNativeImplementation(name) {
  const cached = cachedImplementations[name];
  if (cached) {
    return cached;
  }
  let impl = WINDOW$1[name];
  if (isNativeFunction(impl)) {
    return cachedImplementations[name] = impl.bind(WINDOW$1);
  }
  const document2 = WINDOW$1.document;
  if (document2 && typeof document2.createElement === "function") {
    try {
      const sandbox = document2.createElement("iframe");
      sandbox.hidden = true;
      document2.head.appendChild(sandbox);
      const contentWindow = sandbox.contentWindow;
      if (contentWindow == null ? void 0 : contentWindow[name]) {
        impl = contentWindow[name];
      }
      document2.head.removeChild(sandbox);
    } catch (e) {
      DEBUG_BUILD$1 && debug.warn(`Could not create sandbox iframe for ${name} check, bailing to window.${name}: `, e);
    }
  }
  if (!impl) {
    return impl;
  }
  return cachedImplementations[name] = impl.bind(WINDOW$1);
}
function clearCachedImplementation(name) {
  cachedImplementations[name] = void 0;
}
const SENTRY_XHR_DATA_KEY = "__sentry_xhr_v3__";
function addXhrInstrumentationHandler(handler) {
  const type = "xhr";
  addHandler(type, handler);
  maybeInstrument(type, instrumentXHR);
}
function instrumentXHR() {
  if (!WINDOW$1.XMLHttpRequest) {
    return;
  }
  const xhrproto = XMLHttpRequest.prototype;
  xhrproto.open = new Proxy(xhrproto.open, {
    apply(originalOpen, xhrOpenThisArg, xhrOpenArgArray) {
      const virtualError = new Error();
      const startTimestamp = timestampInSeconds() * 1e3;
      const method = isString(xhrOpenArgArray[0]) ? xhrOpenArgArray[0].toUpperCase() : void 0;
      const url = parseXhrUrlArg(xhrOpenArgArray[1]);
      if (!method || !url) {
        return originalOpen.apply(xhrOpenThisArg, xhrOpenArgArray);
      }
      xhrOpenThisArg[SENTRY_XHR_DATA_KEY] = {
        method,
        url,
        request_headers: {}
      };
      if (method === "POST" && url.match(/sentry_key/)) {
        xhrOpenThisArg.__sentry_own_request__ = true;
      }
      const onreadystatechangeHandler = () => {
        const xhrInfo = xhrOpenThisArg[SENTRY_XHR_DATA_KEY];
        if (!xhrInfo) {
          return;
        }
        if (xhrOpenThisArg.readyState === 4) {
          try {
            xhrInfo.status_code = xhrOpenThisArg.status;
          } catch {
          }
          const handlerData = {
            endTimestamp: timestampInSeconds() * 1e3,
            startTimestamp,
            xhr: xhrOpenThisArg,
            virtualError
          };
          triggerHandlers("xhr", handlerData);
        }
      };
      if ("onreadystatechange" in xhrOpenThisArg && typeof xhrOpenThisArg.onreadystatechange === "function") {
        xhrOpenThisArg.onreadystatechange = new Proxy(xhrOpenThisArg.onreadystatechange, {
          apply(originalOnreadystatechange, onreadystatechangeThisArg, onreadystatechangeArgArray) {
            onreadystatechangeHandler();
            return originalOnreadystatechange.apply(onreadystatechangeThisArg, onreadystatechangeArgArray);
          }
        });
      } else {
        xhrOpenThisArg.addEventListener("readystatechange", onreadystatechangeHandler);
      }
      xhrOpenThisArg.setRequestHeader = new Proxy(xhrOpenThisArg.setRequestHeader, {
        apply(originalSetRequestHeader, setRequestHeaderThisArg, setRequestHeaderArgArray) {
          const [header, value] = setRequestHeaderArgArray;
          const xhrInfo = setRequestHeaderThisArg[SENTRY_XHR_DATA_KEY];
          if (xhrInfo && isString(header) && isString(value)) {
            xhrInfo.request_headers[header.toLowerCase()] = value;
          }
          return originalSetRequestHeader.apply(setRequestHeaderThisArg, setRequestHeaderArgArray);
        }
      });
      return originalOpen.apply(xhrOpenThisArg, xhrOpenArgArray);
    }
  });
  xhrproto.send = new Proxy(xhrproto.send, {
    apply(originalSend, sendThisArg, sendArgArray) {
      const sentryXhrData = sendThisArg[SENTRY_XHR_DATA_KEY];
      if (!sentryXhrData) {
        return originalSend.apply(sendThisArg, sendArgArray);
      }
      if (sendArgArray[0] !== void 0) {
        sentryXhrData.body = sendArgArray[0];
      }
      const handlerData = {
        startTimestamp: timestampInSeconds() * 1e3,
        xhr: sendThisArg
      };
      triggerHandlers("xhr", handlerData);
      return originalSend.apply(sendThisArg, sendArgArray);
    }
  });
}
function parseXhrUrlArg(url) {
  if (isString(url)) {
    return url;
  }
  try {
    return url.toString();
  } catch {
  }
  return void 0;
}
const DEFAULT_BROWSER_TRANSPORT_BUFFER_SIZE = 40;
function makeFetchTransport(options, nativeFetch = getNativeImplementation("fetch")) {
  let pendingBodySize = 0;
  let pendingCount = 0;
  async function makeRequest(request) {
    const requestSize = request.body.length;
    pendingBodySize += requestSize;
    pendingCount++;
    const requestOptions = {
      body: request.body,
      method: "POST",
      referrerPolicy: "strict-origin",
      headers: options.headers,
      // Outgoing requests are usually cancelled when navigating to a different page, causing a "TypeError: Failed to
      // fetch" error and sending a "network_error" client-outcome - in Chrome, the request status shows "(cancelled)".
      // The `keepalive` flag keeps outgoing requests alive, even when switching pages. We want this since we're
      // frequently sending events right before the user is switching pages (eg. when finishing navigation transactions).
      // Gotchas:
      // - `keepalive` isn't supported by Firefox
      // - As per spec (https://fetch.spec.whatwg.org/#http-network-or-cache-fetch):
      //   If the sum of contentLength and inflightKeepaliveBytes is greater than 64 kibibytes, then return a network error.
      //   We will therefore only activate the flag when we're below that limit.
      // There is also a limit of requests that can be open at the same time, so we also limit this to 15
      // See https://github.com/getsentry/sentry-javascript/pull/7553 for details
      keepalive: pendingBodySize <= 6e4 && pendingCount < 15,
      ...options.fetchOptions
    };
    try {
      const response = await nativeFetch(options.url, requestOptions);
      return {
        statusCode: response.status,
        headers: {
          "x-sentry-rate-limits": response.headers.get("X-Sentry-Rate-Limits"),
          "retry-after": response.headers.get("Retry-After")
        }
      };
    } catch (e) {
      clearCachedImplementation("fetch");
      throw e;
    } finally {
      pendingBodySize -= requestSize;
      pendingCount--;
    }
  }
  return createTransport(
    options,
    makeRequest,
    makePromiseBuffer(options.bufferSize || DEFAULT_BROWSER_TRANSPORT_BUFFER_SIZE)
  );
}
const DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const CHROME_PRIORITY = 30;
const GECKO_PRIORITY = 50;
function createFrame(filename, func, lineno, colno) {
  const frame = {
    filename,
    function: func === "<anonymous>" ? UNKNOWN_FUNCTION : func,
    in_app: true
    // All browser frames are considered in_app
  };
  if (lineno !== void 0) {
    frame.lineno = lineno;
  }
  if (colno !== void 0) {
    frame.colno = colno;
  }
  return frame;
}
const chromeRegexNoFnName = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i;
const chromeRegex = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
const chromeEvalRegex = /\((\S*)(?::(\d+))(?::(\d+))\)/;
const chromeDataUriRegex = /at (.+?) ?\(data:(.+?),/;
const chromeStackParserFn = (line) => {
  var _a;
  const dataUriMatch = line.match(chromeDataUriRegex);
  if (dataUriMatch) {
    return {
      filename: `<data:${dataUriMatch[2]}>`,
      function: dataUriMatch[1]
    };
  }
  const noFnParts = chromeRegexNoFnName.exec(line);
  if (noFnParts) {
    const [, filename, line2, col] = noFnParts;
    return createFrame(filename, UNKNOWN_FUNCTION, +line2, +col);
  }
  const parts = chromeRegex.exec(line);
  if (parts) {
    const isEval = ((_a = parts[2]) == null ? void 0 : _a.indexOf("eval")) === 0;
    if (isEval) {
      const subMatch = chromeEvalRegex.exec(parts[2]);
      if (subMatch) {
        parts[2] = subMatch[1];
        parts[3] = subMatch[2];
        parts[4] = subMatch[3];
      }
    }
    const [func, filename] = extractSafariExtensionDetails(parts[1] || UNKNOWN_FUNCTION, parts[2]);
    return createFrame(filename, func, parts[3] ? +parts[3] : void 0, parts[4] ? +parts[4] : void 0);
  }
  return;
};
const chromeStackLineParser = [CHROME_PRIORITY, chromeStackParserFn];
const geckoREgex = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
const geckoEvalRegex = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
const gecko = (line) => {
  const parts = geckoREgex.exec(line);
  if (parts) {
    const isEval = parts[3] && parts[3].indexOf(" > eval") > -1;
    if (isEval) {
      const subMatch = geckoEvalRegex.exec(parts[3]);
      if (subMatch) {
        parts[1] = parts[1] || "eval";
        parts[3] = subMatch[1];
        parts[4] = subMatch[2];
        parts[5] = "";
      }
    }
    let filename = parts[3];
    let func = parts[1] || UNKNOWN_FUNCTION;
    [func, filename] = extractSafariExtensionDetails(func, filename);
    return createFrame(filename, func, parts[4] ? +parts[4] : void 0, parts[5] ? +parts[5] : void 0);
  }
  return;
};
const geckoStackLineParser = [GECKO_PRIORITY, gecko];
const defaultStackLineParsers = [chromeStackLineParser, geckoStackLineParser];
const defaultStackParser = createStackParser(...defaultStackLineParsers);
const extractSafariExtensionDetails = (func, filename) => {
  const isSafariExtension = func.indexOf("safari-extension") !== -1;
  const isSafariWebExtension = func.indexOf("safari-web-extension") !== -1;
  return isSafariExtension || isSafariWebExtension ? [
    func.indexOf("@") !== -1 ? func.split("@")[0] : UNKNOWN_FUNCTION,
    isSafariExtension ? `safari-extension:${filename}` : `safari-web-extension:${filename}`
  ] : [func, filename];
};
const MAX_ALLOWED_STRING_LENGTH = 1024;
const INTEGRATION_NAME$4 = "Breadcrumbs";
const _breadcrumbsIntegration = (options = {}) => {
  const _options = {
    console: true,
    dom: true,
    fetch: true,
    history: true,
    sentry: true,
    xhr: true,
    ...options
  };
  return {
    name: INTEGRATION_NAME$4,
    setup(client2) {
      if (_options.console) {
        addConsoleInstrumentationHandler(_getConsoleBreadcrumbHandler(client2));
      }
      if (_options.dom) {
        addClickKeypressInstrumentationHandler(_getDomBreadcrumbHandler(client2, _options.dom));
      }
      if (_options.xhr) {
        addXhrInstrumentationHandler(_getXhrBreadcrumbHandler(client2));
      }
      if (_options.fetch) {
        addFetchInstrumentationHandler(_getFetchBreadcrumbHandler(client2));
      }
      if (_options.history) {
        addHistoryInstrumentationHandler(_getHistoryBreadcrumbHandler(client2));
      }
      if (_options.sentry) {
        client2.on("beforeSendEvent", _getSentryBreadcrumbHandler(client2));
      }
    }
  };
};
const breadcrumbsIntegration = defineIntegration(_breadcrumbsIntegration);
function _getSentryBreadcrumbHandler(client2) {
  return function addSentryBreadcrumb(event) {
    if (getClient() !== client2) {
      return;
    }
    addBreadcrumb(
      {
        category: `sentry.${event.type === "transaction" ? "transaction" : "event"}`,
        event_id: event.event_id,
        level: event.level,
        message: getEventDescription(event)
      },
      {
        event
      }
    );
  };
}
function _getDomBreadcrumbHandler(client2, dom2) {
  return function _innerDomBreadcrumb(handlerData) {
    if (getClient() !== client2) {
      return;
    }
    let target;
    let componentName;
    let keyAttrs = typeof dom2 === "object" ? dom2.serializeAttribute : void 0;
    let maxStringLength = typeof dom2 === "object" && typeof dom2.maxStringLength === "number" ? dom2.maxStringLength : void 0;
    if (maxStringLength && maxStringLength > MAX_ALLOWED_STRING_LENGTH) {
      DEBUG_BUILD && debug.warn(
        `\`dom.maxStringLength\` cannot exceed ${MAX_ALLOWED_STRING_LENGTH}, but a value of ${maxStringLength} was configured. Sentry will use ${MAX_ALLOWED_STRING_LENGTH} instead.`
      );
      maxStringLength = MAX_ALLOWED_STRING_LENGTH;
    }
    if (typeof keyAttrs === "string") {
      keyAttrs = [keyAttrs];
    }
    try {
      const event = handlerData.event;
      const element = _isEvent(event) ? event.target : event;
      target = htmlTreeAsString(element, { keyAttrs, maxStringLength });
      componentName = getComponentName(element);
    } catch {
      target = "<unknown>";
    }
    if (target.length === 0) {
      return;
    }
    const breadcrumb = {
      category: `ui.${handlerData.name}`,
      message: target
    };
    if (componentName) {
      breadcrumb.data = { "ui.component_name": componentName };
    }
    addBreadcrumb(breadcrumb, {
      event: handlerData.event,
      name: handlerData.name,
      global: handlerData.global
    });
  };
}
function _getConsoleBreadcrumbHandler(client2) {
  return function _consoleBreadcrumb(handlerData) {
    if (getClient() !== client2) {
      return;
    }
    const breadcrumb = {
      category: "console",
      data: {
        arguments: handlerData.args,
        logger: "console"
      },
      level: severityLevelFromString(handlerData.level),
      message: safeJoin(handlerData.args, " ")
    };
    if (handlerData.level === "assert") {
      if (handlerData.args[0] === false) {
        breadcrumb.message = `Assertion failed: ${safeJoin(handlerData.args.slice(1), " ") || "console.assert"}`;
        breadcrumb.data.arguments = handlerData.args.slice(1);
      } else {
        return;
      }
    }
    addBreadcrumb(breadcrumb, {
      input: handlerData.args,
      level: handlerData.level
    });
  };
}
function _getXhrBreadcrumbHandler(client2) {
  return function _xhrBreadcrumb(handlerData) {
    if (getClient() !== client2) {
      return;
    }
    const { startTimestamp, endTimestamp } = handlerData;
    const sentryXhrData = handlerData.xhr[SENTRY_XHR_DATA_KEY];
    if (!startTimestamp || !endTimestamp || !sentryXhrData) {
      return;
    }
    const { method, url, status_code, body } = sentryXhrData;
    const data = {
      method,
      url,
      status_code
    };
    const hint = {
      xhr: handlerData.xhr,
      input: body,
      startTimestamp,
      endTimestamp
    };
    const breadcrumb = {
      category: "xhr",
      data,
      type: "http",
      level: getBreadcrumbLogLevelFromHttpStatusCode(status_code)
    };
    client2.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
    addBreadcrumb(breadcrumb, hint);
  };
}
function _getFetchBreadcrumbHandler(client2) {
  return function _fetchBreadcrumb(handlerData) {
    if (getClient() !== client2) {
      return;
    }
    const { startTimestamp, endTimestamp } = handlerData;
    if (!endTimestamp) {
      return;
    }
    if (handlerData.fetchData.url.match(/sentry_key/) && handlerData.fetchData.method === "POST") {
      return;
    }
    if (handlerData.error) {
      const hint = {
        data: handlerData.error,
        input: handlerData.args,
        startTimestamp,
        endTimestamp
      };
      const breadcrumb = {
        category: "fetch",
        data: handlerData.fetchData,
        level: "error",
        type: "http"
      };
      client2.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
      addBreadcrumb(breadcrumb, hint);
    } else {
      const response = handlerData.response;
      const data = {
        ...handlerData.fetchData,
        status_code: response == null ? void 0 : response.status
      };
      const hint = {
        input: handlerData.args,
        response,
        startTimestamp,
        endTimestamp
      };
      const breadcrumb = {
        category: "fetch",
        data,
        type: "http",
        level: getBreadcrumbLogLevelFromHttpStatusCode(data.status_code)
      };
      client2.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
      addBreadcrumb(breadcrumb, hint);
    }
  };
}
function _getHistoryBreadcrumbHandler(client2) {
  return function _historyBreadcrumb(handlerData) {
    if (getClient() !== client2) {
      return;
    }
    let from = handlerData.from;
    let to = handlerData.to;
    const parsedLoc = parseUrl(WINDOW$2.location.href);
    let parsedFrom = from ? parseUrl(from) : void 0;
    const parsedTo = parseUrl(to);
    if (!(parsedFrom == null ? void 0 : parsedFrom.path)) {
      parsedFrom = parsedLoc;
    }
    if (parsedLoc.protocol === parsedTo.protocol && parsedLoc.host === parsedTo.host) {
      to = parsedTo.relative;
    }
    if (parsedLoc.protocol === parsedFrom.protocol && parsedLoc.host === parsedFrom.host) {
      from = parsedFrom.relative;
    }
    addBreadcrumb({
      category: "navigation",
      data: {
        from,
        to
      }
    });
  };
}
function _isEvent(event) {
  return !!event && !!event.target;
}
const DEFAULT_EVENT_TARGET = "EventTarget,Window,Node,ApplicationCache,AudioTrackList,BroadcastChannel,ChannelMergerNode,CryptoOperation,EventSource,FileReader,HTMLUnknownElement,IDBDatabase,IDBRequest,IDBTransaction,KeyOperation,MediaController,MessagePort,ModalWindow,Notification,SVGElementInstance,Screen,SharedWorker,TextTrack,TextTrackCue,TextTrackList,WebSocket,WebSocketWorker,Worker,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload".split(
  ","
);
const INTEGRATION_NAME$3 = "BrowserApiErrors";
const _browserApiErrorsIntegration = (options = {}) => {
  const _options = {
    XMLHttpRequest: true,
    eventTarget: true,
    requestAnimationFrame: true,
    setInterval: true,
    setTimeout: true,
    unregisterOriginalCallbacks: false,
    ...options
  };
  return {
    name: INTEGRATION_NAME$3,
    // TODO: This currently only works for the first client this is setup
    // We may want to adjust this to check for client etc.
    setupOnce() {
      if (_options.setTimeout) {
        fill(WINDOW$2, "setTimeout", _wrapTimeFunction);
      }
      if (_options.setInterval) {
        fill(WINDOW$2, "setInterval", _wrapTimeFunction);
      }
      if (_options.requestAnimationFrame) {
        fill(WINDOW$2, "requestAnimationFrame", _wrapRAF);
      }
      if (_options.XMLHttpRequest && "XMLHttpRequest" in WINDOW$2) {
        fill(XMLHttpRequest.prototype, "send", _wrapXHR);
      }
      const eventTargetOption = _options.eventTarget;
      if (eventTargetOption) {
        const eventTarget = Array.isArray(eventTargetOption) ? eventTargetOption : DEFAULT_EVENT_TARGET;
        eventTarget.forEach((target) => _wrapEventTarget(target, _options));
      }
    }
  };
};
const browserApiErrorsIntegration = defineIntegration(_browserApiErrorsIntegration);
function _wrapTimeFunction(original) {
  return function(...args) {
    const originalCallback = args[0];
    args[0] = wrap(originalCallback, {
      mechanism: {
        handled: false,
        type: `auto.browser.browserapierrors.${getFunctionName(original)}`
      }
    });
    return original.apply(this, args);
  };
}
function _wrapRAF(original) {
  return function(callback) {
    return original.apply(this, [
      wrap(callback, {
        mechanism: {
          data: {
            handler: getFunctionName(original)
          },
          handled: false,
          type: "auto.browser.browserapierrors.requestAnimationFrame"
        }
      })
    ]);
  };
}
function _wrapXHR(originalSend) {
  return function(...args) {
    const xhr = this;
    const xmlHttpRequestProps = ["onload", "onerror", "onprogress", "onreadystatechange"];
    xmlHttpRequestProps.forEach((prop) => {
      if (prop in xhr && typeof xhr[prop] === "function") {
        fill(xhr, prop, function(original) {
          const wrapOptions = {
            mechanism: {
              data: {
                handler: getFunctionName(original)
              },
              handled: false,
              type: `auto.browser.browserapierrors.xhr.${prop}`
            }
          };
          const originalFunction = getOriginalFunction(original);
          if (originalFunction) {
            wrapOptions.mechanism.data.handler = getFunctionName(originalFunction);
          }
          return wrap(original, wrapOptions);
        });
      }
    });
    return originalSend.apply(this, args);
  };
}
function _wrapEventTarget(target, integrationOptions) {
  var _a, _b;
  const globalObject = WINDOW$2;
  const proto = (_a = globalObject[target]) == null ? void 0 : _a.prototype;
  if (!((_b = proto == null ? void 0 : proto.hasOwnProperty) == null ? void 0 : _b.call(proto, "addEventListener"))) {
    return;
  }
  fill(proto, "addEventListener", function(original) {
    return function(eventName, fn, options) {
      try {
        if (isEventListenerObject(fn)) {
          fn.handleEvent = wrap(fn.handleEvent, {
            mechanism: {
              data: {
                handler: getFunctionName(fn),
                target
              },
              handled: false,
              type: "auto.browser.browserapierrors.handleEvent"
            }
          });
        }
      } catch {
      }
      if (integrationOptions.unregisterOriginalCallbacks) {
        unregisterOriginalCallback(this, eventName, fn);
      }
      return original.apply(this, [
        eventName,
        wrap(fn, {
          mechanism: {
            data: {
              handler: getFunctionName(fn),
              target
            },
            handled: false,
            type: "auto.browser.browserapierrors.addEventListener"
          }
        }),
        options
      ]);
    };
  });
  fill(proto, "removeEventListener", function(originalRemoveEventListener) {
    return function(eventName, fn, options) {
      try {
        const originalEventHandler = fn.__sentry_wrapped__;
        if (originalEventHandler) {
          originalRemoveEventListener.call(this, eventName, originalEventHandler, options);
        }
      } catch {
      }
      return originalRemoveEventListener.call(this, eventName, fn, options);
    };
  });
}
function isEventListenerObject(obj) {
  return typeof obj.handleEvent === "function";
}
function unregisterOriginalCallback(target, eventName, fn) {
  if (target && typeof target === "object" && "removeEventListener" in target && typeof target.removeEventListener === "function") {
    target.removeEventListener(eventName, fn);
  }
}
const browserSessionIntegration = defineIntegration((options = {}) => {
  const lifecycle = options.lifecycle ?? "route";
  return {
    name: "BrowserSession",
    setupOnce() {
      if (typeof WINDOW$2.document === "undefined") {
        DEBUG_BUILD && debug.warn("Using the `browserSessionIntegration` in non-browser environments is not supported.");
        return;
      }
      startSession({ ignoreDuration: true });
      captureSession();
      const isolationScope = getIsolationScope();
      let previousUser = isolationScope.getUser();
      isolationScope.addScopeListener((scope2) => {
        const maybeNewUser = scope2.getUser();
        if ((previousUser == null ? void 0 : previousUser.id) !== (maybeNewUser == null ? void 0 : maybeNewUser.id) || (previousUser == null ? void 0 : previousUser.ip_address) !== (maybeNewUser == null ? void 0 : maybeNewUser.ip_address)) {
          captureSession();
          previousUser = maybeNewUser;
        }
      });
      if (lifecycle === "route") {
        addHistoryInstrumentationHandler(({ from, to }) => {
          if (from !== to) {
            startSession({ ignoreDuration: true });
            captureSession();
          }
        });
      }
    }
  };
});
const INTEGRATION_NAME$2 = "CultureContext";
const _cultureContextIntegration = () => {
  return {
    name: INTEGRATION_NAME$2,
    preprocessEvent(event) {
      var _a;
      const culture = getCultureContext();
      if (culture) {
        event.contexts = {
          ...event.contexts,
          culture: { ...culture, ...(_a = event.contexts) == null ? void 0 : _a.culture }
        };
      }
    }
  };
};
const cultureContextIntegration = defineIntegration(_cultureContextIntegration);
function getCultureContext() {
  try {
    const intl = WINDOW$2.Intl;
    if (!intl) {
      return void 0;
    }
    const options = intl.DateTimeFormat().resolvedOptions();
    return {
      locale: options.locale,
      timezone: options.timeZone,
      calendar: options.calendar
    };
  } catch {
    return void 0;
  }
}
const INTEGRATION_NAME$1 = "GlobalHandlers";
const _globalHandlersIntegration = (options = {}) => {
  const _options = {
    onerror: true,
    onunhandledrejection: true,
    ...options
  };
  return {
    name: INTEGRATION_NAME$1,
    setupOnce() {
      Error.stackTraceLimit = 50;
    },
    setup(client2) {
      if (_options.onerror) {
        _installGlobalOnErrorHandler(client2);
        globalHandlerLog("onerror");
      }
      if (_options.onunhandledrejection) {
        _installGlobalOnUnhandledRejectionHandler(client2);
        globalHandlerLog("onunhandledrejection");
      }
    }
  };
};
const globalHandlersIntegration = defineIntegration(_globalHandlersIntegration);
function _installGlobalOnErrorHandler(client2) {
  addGlobalErrorInstrumentationHandler((data) => {
    const { stackParser, attachStacktrace } = getOptions$1();
    if (getClient() !== client2 || shouldIgnoreOnError()) {
      return;
    }
    const { msg, url, line, column, error: error2 } = data;
    const event = _enhanceEventWithInitialFrame(
      eventFromUnknownInput(stackParser, error2 || msg, void 0, attachStacktrace, false),
      url,
      line,
      column
    );
    event.level = "error";
    captureEvent(event, {
      originalException: error2,
      mechanism: {
        handled: false,
        type: "auto.browser.global_handlers.onerror"
      }
    });
  });
}
function _installGlobalOnUnhandledRejectionHandler(client2) {
  addGlobalUnhandledRejectionInstrumentationHandler((e) => {
    const { stackParser, attachStacktrace } = getOptions$1();
    if (getClient() !== client2 || shouldIgnoreOnError()) {
      return;
    }
    const error2 = _getUnhandledRejectionError(e);
    const event = isPrimitive(error2) ? _eventFromRejectionWithPrimitive(error2) : eventFromUnknownInput(stackParser, error2, void 0, attachStacktrace, true);
    event.level = "error";
    captureEvent(event, {
      originalException: error2,
      mechanism: {
        handled: false,
        type: "auto.browser.global_handlers.onunhandledrejection"
      }
    });
  });
}
function _getUnhandledRejectionError(error2) {
  if (isPrimitive(error2)) {
    return error2;
  }
  try {
    if ("reason" in error2) {
      return error2.reason;
    }
    if ("detail" in error2 && "reason" in error2.detail) {
      return error2.detail.reason;
    }
  } catch {
  }
  return error2;
}
function _eventFromRejectionWithPrimitive(reason) {
  return {
    exception: {
      values: [
        {
          type: "UnhandledRejection",
          // String() is needed because the Primitive type includes symbols (which can't be automatically stringified)
          value: `Non-Error promise rejection captured with value: ${String(reason)}`
        }
      ]
    }
  };
}
function _enhanceEventWithInitialFrame(event, url, lineno, colno) {
  const e = event.exception = event.exception || {};
  const ev = e.values = e.values || [];
  const ev0 = ev[0] = ev[0] || {};
  const ev0s = ev0.stacktrace = ev0.stacktrace || {};
  const ev0sf = ev0s.frames = ev0s.frames || [];
  if (ev0sf.length === 0) {
    ev0sf.push({
      colno,
      lineno,
      filename: getFilenameFromUrl(url) ?? getLocationHref(),
      function: UNKNOWN_FUNCTION,
      in_app: true
    });
  }
  return event;
}
function globalHandlerLog(type) {
  DEBUG_BUILD && debug.log(`Global Handler attached: ${type}`);
}
function getOptions$1() {
  const client2 = getClient();
  const options = (client2 == null ? void 0 : client2.getOptions()) || {
    stackParser: () => [],
    attachStacktrace: false
  };
  return options;
}
function getFilenameFromUrl(url) {
  if (!isString(url) || url.length === 0) {
    return void 0;
  }
  if (url.startsWith("data:")) {
    return `<${stripDataUrlContent(url, false)}>`;
  }
  return url;
}
const httpContextIntegration = defineIntegration(() => {
  return {
    name: "HttpContext",
    preprocessEvent(event) {
      var _a;
      if (!WINDOW$2.navigator && !WINDOW$2.location && !WINDOW$2.document) {
        return;
      }
      const reqData = getHttpRequestData();
      const headers = {
        ...reqData.headers,
        ...(_a = event.request) == null ? void 0 : _a.headers
      };
      event.request = {
        ...reqData,
        ...event.request,
        headers
      };
    }
  };
});
const DEFAULT_KEY = "cause";
const DEFAULT_LIMIT = 5;
const INTEGRATION_NAME = "LinkedErrors";
const _linkedErrorsIntegration = (options = {}) => {
  const limit = options.limit || DEFAULT_LIMIT;
  const key = options.key || DEFAULT_KEY;
  return {
    name: INTEGRATION_NAME,
    preprocessEvent(event, hint, client2) {
      const options2 = client2.getOptions();
      applyAggregateErrorsToEvent(
        // This differs from the LinkedErrors integration in core by using a different exceptionFromError function
        exceptionFromError,
        options2.stackParser,
        key,
        limit,
        event,
        hint
      );
    }
  };
};
const linkedErrorsIntegration = defineIntegration(_linkedErrorsIntegration);
function getDefaultIntegrations(_options) {
  return [
    // TODO(v11): Replace with `eventFiltersIntegration` once we remove the deprecated `inboundFiltersIntegration`
    // eslint-disable-next-line deprecation/deprecation
    inboundFiltersIntegration(),
    functionToStringIntegration(),
    conversationIdIntegration(),
    browserApiErrorsIntegration(),
    breadcrumbsIntegration(),
    globalHandlersIntegration(),
    linkedErrorsIntegration(),
    dedupeIntegration(),
    httpContextIntegration(),
    cultureContextIntegration(),
    browserSessionIntegration()
  ];
}
new TextEncoder();
const decoder = new TextDecoder();
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i2 = 0; i2 < binary.length; i2++) {
    bytes[i2] = binary.charCodeAt(i2);
  }
  return bytes;
}
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
class JOSEError extends Error {
  constructor(message, options) {
    var _a;
    super(message, options);
    __publicField(this, "code", "ERR_JOSE_GENERIC");
    this.name = this.constructor.name;
    (_a = Error.captureStackTrace) == null ? void 0 : _a.call(Error, this, this.constructor);
  }
}
__publicField(JOSEError, "code", "ERR_JOSE_GENERIC");
class JWTInvalid extends JOSEError {
  constructor() {
    super(...arguments);
    __publicField(this, "code", "ERR_JWT_INVALID");
  }
}
__publicField(JWTInvalid, "code", "ERR_JWT_INVALID");
function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
const isObject = (input) => {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
};
function decodeJwt(jwt) {
  if (typeof jwt !== "string")
    throw new JWTInvalid("JWTs must use Compact JWS serialization, JWT must be a string");
  const { 1: payload, length } = jwt.split(".");
  if (length === 5)
    throw new JWTInvalid("Only JWTs using Compact JWS serialization can be decoded");
  if (length !== 3)
    throw new JWTInvalid("Invalid JWT");
  if (!payload)
    throw new JWTInvalid("JWTs must contain a payload");
  let decoded;
  try {
    decoded = decode(payload);
  } catch {
    throw new JWTInvalid("Failed to base64url decode the payload");
  }
  let result;
  try {
    result = JSON.parse(decoder.decode(decoded));
  } catch {
    throw new JWTInvalid("Failed to parse the decoded payload as JSON");
  }
  if (!isObject(result))
    throw new JWTInvalid("Invalid JWT Claims Set");
  return result;
}
const NODE_ENV = "stage";
const EXTENSION_VERSION = "1.22.0";
let client = null;
let scope = null;
function decodeJWT(token) {
  try {
    const payload = decodeJwt(token);
    return payload;
  } catch {
    return null;
  }
}
async function getUserInfoFromToken() {
  try {
    const { accessToken } = await chrome.storage.local.get(["accessToken"]);
    if (!accessToken) {
      return null;
    }
    const payload = decodeJWT(accessToken);
    if (!payload) {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.preferred_username ?? payload.name
    };
  } catch {
    return null;
  }
}
function setSentryUserContext(userInfo) {
  if (!scope) {
    return;
  }
  scope.setUser(userInfo ?? {});
}
async function updateSentryUserContext() {
  const userInfo = await getUserInfoFromToken();
  setSentryUserContext(userInfo);
}
function initializeSentry() {
  if (client && scope) {
    return;
  }
  const integrations = getDefaultIntegrations().filter(
    (defaultIntegration) => !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
      defaultIntegration.name
    )
  );
  client = new BrowserClient({
    enabled: NODE_ENV === "prod",
    dsn: "https://2e60157fd9b2ea4dce7b4193c2670801@o47004.ingest.us.sentry.io/4509877997797376",
    environment: NODE_ENV,
    release: EXTENSION_VERSION,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    integrations
  });
  scope = new Scope();
  scope.setClient(client);
  client.init();
  updateSentryUserContext();
}
function argsToMessage(args) {
  return args.map((arg) => {
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch {
        return "[Unserializable object]";
      }
    }
    return String(arg);
  }).join(" ");
}
async function sendToSentry(...args) {
  if (args.length === 0) {
    return;
  }
  if (!scope) {
    initializeSentry();
  }
  await updateSentryUserContext();
  const existingError = args.find((arg) => arg instanceof Error);
  if (existingError) {
    const otherArgs = args.filter((arg) => arg !== existingError);
    if (otherArgs.length > 0) {
      const contextMessage = argsToMessage(otherArgs);
      const enhancedError = new Error(`${contextMessage} ${existingError.message}`);
      enhancedError.stack = existingError.stack;
      enhancedError.cause = existingError;
      scope == null ? void 0 : scope.captureException(enhancedError);
    } else {
      scope == null ? void 0 : scope.captureException(existingError);
    }
  } else {
    const message = argsToMessage(args);
    scope == null ? void 0 : scope.captureException(new Error(message));
  }
}
async function refreshSentryUserContext() {
  await updateSentryUserContext();
}
function getErrorWithMessage(error2, defaultMessage) {
  if (error2 instanceof FetchNon2xxError$1) {
    const body = error2.response.body;
    if (typeof body.errorCode === "string" && typeof body.errorMessage === "string") {
      return new Error(
        `status: ${error2.response.status}, ${body.errorCode}: ${body.errorMessage}`
      );
    }
    return new Error(
      `status: ${error2.response.status} ,${defaultMessage}: ${JSON.stringify(error2.response.body)}`
    );
  }
  return new Error(`${defaultMessage}`);
}
function logError(..._args) {
  sendToSentry(..._args);
}
function logWarning(..._args) {
  console.warn(..._args);
}
function logDebug(..._args) {
  console.debug(..._args);
}
function getOAuthErrorCode(errorMessage) {
  const lowerMessage = errorMessage.toLowerCase();
  if (lowerMessage.includes("csrf") || lowerMessage.includes("state mismatch")) {
    return "CSRF_DETECTED";
  }
  if (lowerMessage.includes("storage")) {
    return "STORAGE_ERROR";
  }
  if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    return "NETWORK_ERROR";
  }
  return "OAUTH_FAILED";
}
function logErrorWithTabContext(message, tabId, additionalContext) {
  chrome.tabs.get(tabId).then((tab) => {
    logError(message, {
      ...additionalContext,
      tabId,
      url: tab.url,
      status: tab.status
    });
  }).catch(() => {
    logError(message, {
      ...additionalContext,
      tabId
    });
  });
}
function logErrorWithActiveTabContext(message, additionalContext) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab) {
      logError(message, {
        ...additionalContext,
        tabId: activeTab.id,
        url: activeTab.url,
        status: activeTab.status
      });
    } else {
      logError(message, additionalContext);
    }
  });
}
function createMutationLock() {
  let inFlight = null;
  function runOnce(mutation) {
    if (!inFlight) {
      inFlight = mutation().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  }
  function isLocked() {
    return inFlight !== null;
  }
  function clear() {
    inFlight = null;
  }
  return { runOnce, isLocked, clear };
}
const __vite_import_meta_env__ = { "VITE_CLIENT_ID": "dealer-browser-extension" };
const { VITE_CLIENT_ID } = __vite_import_meta_env__;
function getClientId() {
  return VITE_CLIENT_ID;
}
let isLoggingOut = false;
const AUTH_HOST = "https://auth-na.stage.cargurus.com";
const API_HOST$2 = "https://proxinator-na.svc.ue1.site-dev.c-gurus.com";
const REFRESH_BUFFER_TIME = 2 * 60 * 1e3;
let _redirectURL = null;
function getRedirectURL() {
  if (!_redirectURL) {
    _redirectURL = chrome.identity.getRedirectURL();
  }
  return _redirectURL;
}
chrome.runtime.id;
const oauthConfig = {
  clientId: getClientId(),
  authEndpoint: `${AUTH_HOST}/auth/realms/cargurus/protocol/openid-connect/auth`,
  tokenEndpoint: `${AUTH_HOST}/auth/realms/cargurus/protocol/openid-connect/token`,
  logoutEndpoint: `${AUTH_HOST}/auth/realms/cargurus/protocol/openid-connect/logout`,
  scope: "openid site-cars"
};
function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => {
    const hexByte = (byte % 256).toString(16);
    return hexByte.padStart(2, "0");
  }).join("");
}
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCodePoint(...new Uint8Array(hash))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function buildAuthorizationUrl(state, codeChallenge, email) {
  const authUrl = new URL(oauthConfig.authEndpoint);
  authUrl.searchParams.append("client_id", oauthConfig.clientId);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", getRedirectURL());
  authUrl.searchParams.append("scope", oauthConfig.scope);
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("code_challenge", codeChallenge);
  authUrl.searchParams.append("code_challenge_method", "S256");
  if (email) {
    authUrl.searchParams.append("login_hint", email);
  }
  return authUrl;
}
async function exchangeCodeForToken(code, receivedState) {
  try {
    const result = await chrome.storage.local.get(["state", "codeVerifier"]);
    const state = result.state;
    const codeVerifier = result.codeVerifier;
    if (state !== receivedState) {
      logError("State mismatch, possible CSRF attack");
      return false;
    }
    if (!codeVerifier) {
      logError("Code verifier not found");
      return false;
    }
    const tokenUrl = oauthConfig.tokenEndpoint;
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", oauthConfig.clientId);
    params.append("code", code);
    params.append("redirect_uri", getRedirectURL());
    params.append("code_verifier", codeVerifier);
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      credentials: "omit"
    });
    if (!response.ok) {
      const errorData = await response.text();
      logError("Token request failed:", response.status, errorData);
      return false;
    }
    const tokenData = await response.json();
    if (!tokenData.access_token || !tokenData.refresh_token) {
      logError("Invalid token response:", tokenData);
      return false;
    }
    const expiresAt = Date.now() + tokenData.expires_in * 1e3;
    await chrome.storage.local.set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token,
      expiresAt
    });
    await chrome.storage.local.remove(["codeVerifier", "state"]);
    await refreshSentryUserContext();
    return true;
  } catch (error2) {
    logError("Error exchanging code for token:", error2);
    return false;
  }
}
async function initiateOAuthFlow(email) {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);
  await chrome.storage.local.set({ codeVerifier, state });
  const authUrl = buildAuthorizationUrl(state, codeChallenge, email);
  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true
  });
  const responseUrlObj = new URL(responseUrl ?? "");
  const code = responseUrlObj.searchParams.get("code");
  const receivedState = responseUrlObj.searchParams.get("state");
  if (!code) {
    throw new Error("OAuth flow failed: No authorization code received");
  }
  if (receivedState !== state) {
    throw new Error("OAuth flow failed: State mismatch, possible CSRF attack");
  }
  const success = await exchangeCodeForToken(code, receivedState);
  if (!success) {
    throw new Error("OAuth flow failed: Token exchange failed");
  }
}
const tokenRefreshLock = createMutationLock();
async function clearAuthStorage() {
  await chrome.storage.local.remove(["accessToken", "refreshToken", "idToken", "expiresAt"]);
}
async function refreshAccessToken(refreshToken) {
  try {
    const tokenUrl = oauthConfig.tokenEndpoint;
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("client_id", oauthConfig.clientId);
    params.append("refresh_token", refreshToken);
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      credentials: "omit"
    });
    if (!response.ok) {
      const errorText = await response.text();
      await clearAuthStorage();
      throw new Error(
        `Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
    const tokenData = await response.json();
    if (!tokenData.access_token) {
      await clearAuthStorage();
      throw new Error(
        "Token refresh failed: Invalid refresh token response (missing access_token)"
      );
    }
    const expiresAt = Date.now() + tokenData.expires_in * 1e3;
    const update = {
      accessToken: tokenData.access_token,
      expiresAt
    };
    if (tokenData.refresh_token) {
      update.refreshToken = tokenData.refresh_token;
    }
    await chrome.storage.local.set(update);
    await refreshSentryUserContext();
    return true;
  } catch (error2) {
    logError("Error refreshing access token:", error2);
    await clearAuthStorage();
    return false;
  }
}
async function checkLoginStatus() {
  try {
    const { accessToken, refreshToken, expiresAt } = await chrome.storage.local.get([
      "accessToken",
      "refreshToken",
      "expiresAt"
    ]);
    if (!accessToken || !refreshToken) {
      return false;
    }
    const now = Date.now();
    if (!expiresAt || expiresAt - now <= REFRESH_BUFFER_TIME) {
      return await refreshAccessToken(refreshToken);
    }
    return true;
  } catch (error2) {
    logError("Error checking login status:", error2);
    return false;
  }
}
function createLogoutUrl(idToken) {
  const logoutUrl = new URL(oauthConfig.logoutEndpoint);
  logoutUrl.searchParams.append("client_id", oauthConfig.clientId);
  if (idToken) {
    logoutUrl.searchParams.append("id_token_hint", idToken);
  }
  logoutUrl.searchParams.append("post_logout_redirect_uri", getRedirectURL());
  return logoutUrl;
}
async function logout(reason = "manual") {
  if (isLoggingOut) {
    return true;
  }
  isLoggingOut = true;
  let logoutSuccess = false;
  try {
    const result = await chrome.storage.local.get(["idToken"]);
    const idToken = result.idToken;
    if (idToken) {
      try {
        const logoutUrl = createLogoutUrl(idToken);
        await chrome.identity.launchWebAuthFlow({
          url: logoutUrl.toString(),
          interactive: false
        });
      } catch {
      }
    }
    await chrome.storage.local.remove(["accessToken", "refreshToken", "idToken", "expiresAt"]);
    await refreshSentryUserContext();
    logoutSuccess = true;
    return true;
  } catch (error2) {
    logError("Error during logout:", error2);
    try {
      await chrome.storage.local.remove([
        "accessToken",
        "refreshToken",
        "idToken",
        "expiresAt"
      ]);
      logoutSuccess = true;
    } catch (storageError) {
      logError("Error clearing tokens during logout:", storageError);
    }
    return logoutSuccess;
  } finally {
    isLoggingOut = false;
    if (logoutSuccess) {
      try {
        const message = {
          action: "authStateChanged",
          isLoggedIn: false,
          reason
        };
        chrome.runtime.sendMessage(message);
      } catch {
      }
    }
  }
}
async function getValidAccessToken() {
  const { accessToken, refreshToken, expiresAt } = await chrome.storage.local.get([
    "accessToken",
    "refreshToken",
    "expiresAt"
  ]);
  if (!accessToken || !refreshToken || !expiresAt) {
    await logout(
      "session_expired"
      /* SESSION_EXPIRED */
    );
    return null;
  }
  const now = Date.now();
  const isExpiring = expiresAt - now <= REFRESH_BUFFER_TIME;
  if (!isExpiring) {
    return accessToken;
  }
  try {
    return await tokenRefreshLock.runOnce(async () => {
      const success = await refreshAccessToken(refreshToken);
      if (!success) {
        await logout(
          "session_expired"
          /* SESSION_EXPIRED */
        );
        throw new Error("Token refresh failed");
      }
      const updated = await chrome.storage.local.get("accessToken");
      if (!updated.accessToken) {
        await logout(
          "session_expired"
          /* SESSION_EXPIRED */
        );
        throw new Error("Access token missing after refresh");
      }
      return updated.accessToken;
    });
  } catch (error2) {
    logError("Token validation failed:", error2);
    return null;
  }
}
let FetchHelper$1 = class FetchHelper {
  constructor(baseUrl2 = "") {
    /** Base url for the fetch request, defaults to an empty string */
    __publicField(this, "baseUrl");
    this.baseUrl = baseUrl2;
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.patch = this.patch.bind(this);
    this.fetchCg = this.fetchCg.bind(this);
  }
  /**
   * Make request options object
   *
   * Here we add all required request headers and initialization options (e.g., JSON.stringify
   * body property) to the fetch request.
   */
  static makeRequestOptions({ body, ...restInit }) {
    const req = { ...restInit };
    {
      req.credentials = "omit";
    }
    req.headers = {
      ...req.headers,
      "X-Requested-With": "XMLHttpRequest",
      "X-CG-Client-Id": getClientId()
    };
    if (body instanceof FormData) {
      req.body = body;
    } else if ((body == null ? void 0 : body.constructor) === Object) {
      req.body = JSON.stringify(body);
      req.headers = {
        ...req.headers,
        "Content-Type": "application/json; charset=utf-8"
      };
    } else if (body) {
      throw new Error("body property only supports object literals and FormData objects");
    }
    return req;
  }
  /** Create a FetchNon2xxError which results from a non 2xx fetch response */
  static async createFetchNon2xxError(res) {
    const { status, url, headers } = res;
    let body;
    try {
      body = await res.json();
    } catch (error2) {
      body = {
        errors: [{ message: JSON.stringify(error2) }]
      };
    }
    return new FetchNon2xxError$1({ status, url, headers, body });
  }
  /**
   * Convert a successful fetch response to json or text (depending on `responseType`); throw a
   * `FetchNon2xxError` for non-2xx responses. Returns `undefined` for 204 No Content.
   */
  static async validateResponse(res, responseType = "json") {
    if (!res.ok) {
      throw await this.createFetchNon2xxError(res);
    }
    if (res.status === 204) {
      return void 0;
    }
    switch (responseType) {
      case "text": {
        return await res.text();
      }
      case "json": {
        return await res.json();
      }
      default: {
        return await res.json();
      }
    }
  }
  /**
   * Base fetch wrapper that converts the response to json or text (based on `responseType`),
   * validates it, and returns a typed result.
   */
  async fetchCg(url, cgInit = {}) {
    const { interceptResponse, responseType = "json", ...fetchCgInit } = cgInit;
    const requestUrl = this.baseUrl + url;
    const init = FetchHelper.makeRequestOptions(fetchCgInit);
    const res = await fetch(requestUrl, init);
    if (interceptResponse) {
      interceptResponse({
        init,
        response: res.clone()
      });
    }
    return FetchHelper.validateResponse(res, responseType);
  }
  /** Sets method to get for fetchCg */
  get(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "get" });
  }
  /** Sets method to post for fetchCg */
  post(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "post" });
  }
  /** Sets method to put for fetchCg */
  put(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "put" });
  }
  /** Sets method to patch for fetchCg */
  patch(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "PATCH" });
  }
};
new FetchHelper$1();
class AuthenticatedFetchHelper {
  constructor(baseUrl2 = "") {
    __publicField(this, "fetchHelper");
    this.fetchHelper = new FetchHelper$1(baseUrl2);
  }
  /** Enhanced fetchCg that automatically handles authentication and session expiration */
  async fetchCg(url, cgInit = {}) {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return null;
    }
    const authenticatedInit = {
      ...cgInit,
      headers: {
        ...cgInit.headers,
        Authorization: `Bearer ${accessToken}`
      }
    };
    return this.fetchHelper.fetchCg(url, authenticatedInit);
  }
  /** Authenticated GET request with automatic token injection and session handling */
  async get(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "get" });
  }
  /** Authenticated POST request with automatic token injection and session handling */
  async post(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "post" });
  }
  /** Authenticated PUT request with automatic token injection and session handling */
  async put(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "put" });
  }
  /** Authenticated PATCH request with automatic token injection and session handling */
  async patch(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "PATCH" });
  }
  /**
   * Creates an adapter that makes this AuthenticatedFetchHelper compatible with external
   * FetchHelper interfaces. This is useful when passing to external packages that expect a
   * specific FetchHelper type.
   */
  asExternalFetchHelper() {
    return {
      fetchCg: async (url, cgInit) => {
        const result = await this.fetchCg(url, cgInit);
        if (result === null) {
          throw new Error("Authentication failed: Session expired");
        }
        return result;
      },
      get: async (url, cgInit) => {
        const result = await this.get(url, cgInit);
        if (result === null) {
          throw new Error("Authentication failed: Session expired");
        }
        return result;
      },
      post: async (url, cgInit) => {
        const result = await this.post(url, cgInit);
        if (result === null) {
          throw new Error("Authentication failed: Session expired");
        }
        return result;
      },
      put: async (url, cgInit) => {
        const result = await this.put(url, cgInit);
        if (result === null) {
          throw new Error("Authentication failed: Session expired");
        }
        return result;
      },
      patch: async (url, cgInit) => {
        const result = await this.patch(url, cgInit);
        if (result === null) {
          throw new Error("Authentication failed: Session expired");
        }
        return result;
      }
    };
  }
}
const authFh = new AuthenticatedFetchHelper();
const API_HOST$1 = "https://proxinator-na.svc.ue1.site-dev.c-gurus.com";
const carValuesAuthFh = new AuthenticatedFetchHelper(API_HOST$1).asExternalFetchHelper();
function createStorageService(storage) {
  const set = async (key, value) => {
    await storage.set({ [key]: value });
  };
  const get = async (key) => {
    const result = await storage.get(key);
    return result[key];
  };
  const remove = async (key) => {
    await storage.remove(key);
  };
  const clear = async () => {
    await storage.clear();
  };
  const getAll = async () => storage.get(null);
  const has = async (key) => {
    const result = await storage.get(key);
    return key in result;
  };
  return {
    set,
    get,
    remove,
    clear,
    getAll,
    has
  };
}
const localStorageService = createStorageService(chrome.storage.local);
createStorageService(chrome.storage.sync);
const sessionStorageService = createStorageService(chrome.storage.session);
const API_HOST = "https://proxinator-na.svc.ue1.site-dev.c-gurus.com";
const SERVICE_PROVIDERS_API_BASE_URL = `${API_HOST}/Cars/dealerdashboard/api/GetDealersAssociatedWithCurrentUser.action`;
const ALL_SERVICE_PROVIDERS_STORAGE_KEY = "allServiceProviders";
const SERVICE_PROVIDER_ID_STORAGE_KEY = "serviceProviderId";
async function fetchServiceProviders(serviceProviderId) {
  try {
    const params = new URLSearchParams();
    if (serviceProviderId) {
      params.append("serviceProviderId", `${serviceProviderId}`);
    }
    const response = await authFh.get(
      `${SERVICE_PROVIDERS_API_BASE_URL}?${params.toString()}`
    );
    if (response === null) {
      return [];
    }
    return response;
  } catch (error2) {
    throw getErrorWithMessage(
      error2,
      "There was an unexpected error fetching service providers"
    );
  }
}
const PRICE_RECOMMENDATION_API_BASE_URL = `${API_HOST$2}/Cars/dealerdashboard/api/BrowserExtensionPriceRecApi.action`;
const SELECTED_VEHICLE_INFO_KEY = "selectedVehicleInfo";
async function fetchPricingRecData(serviceProviderId, vins) {
  try {
    const params = new URLSearchParams();
    params.append("serviceProviderId", `sp${serviceProviderId}`);
    vins.forEach((vin) => {
      params.append("vins", vin);
    });
    const result = await authFh.get(
      `${PRICE_RECOMMENDATION_API_BASE_URL}?${params.toString()}`
    );
    if (result === null) {
      return { results: {}, notFoundVehicleDetails: {}, notFound: [] };
    }
    return result;
  } catch (error2) {
    throw getErrorWithMessage(
      error2,
      "There was an unexpected error fetching price recommendation data"
    );
  }
}
const LEAD_PREDICTION_API_BASE_URL = `${API_HOST$2}/Cars/dealerdashboard/api/LeadPredictionInvocationApi.action`;
async function fetchLeadPredictions(serviceProviderId, listingId, prices) {
  try {
    const params = new URLSearchParams();
    params.append("serviceProviderId", `sp${serviceProviderId}`);
    const response = await authFh.post(
      `${LEAD_PREDICTION_API_BASE_URL}?${params.toString()}`,
      { body: { listingId, prices } }
    );
    if (response === null) {
      return { predictions: [] };
    }
    return response;
  } catch (error2) {
    throw getErrorWithMessage(
      error2,
      "There was an unexpected error fetching lead prediction data"
    );
  }
}
const PUBLISH_PRICE_API_BASE_URL = `${API_HOST$2}/Cars/dealerdashboard/publishPrice.action`;
async function publishPrice(listing, fees, newPrice, newPriceIncludesFees) {
  const {
    serviceProviderId,
    id: listingId,
    vehicleIdentifier: vin,
    basePrice: oldPrice,
    optimizedPrice: recommendedPrice
  } = listing;
  const params = new URLSearchParams();
  params.append("serviceProviderId", `sp${serviceProviderId}`);
  let response = null;
  try {
    response = await authFh.post(
      `${PUBLISH_PRICE_API_BASE_URL}?${params.toString()}`,
      {
        body: {
          listingId,
          vin,
          oldPrice,
          newPrice,
          newPriceIncludesFees,
          recommendedPrice,
          fees,
          serviceProviderId,
          priceUpdateSource: "CHROME_EXTENSION"
        }
      }
    );
  } catch (error2) {
    throw getErrorWithMessage(error2, "There was an unexpected error publishing price");
  }
  if (response === null) {
    throw new Error("Session expired and logout was automatically triggered");
  }
  const priceUpdateDetail = response[0];
  switch (priceUpdateDetail.status) {
    case "PENDING":
    case "SENT": {
      return;
    }
    case "FAIL": {
      throw new Error(priceUpdateDetail.responseMessage ?? "Error during price publish.");
    }
    default: {
      throw new Error(
        `Unknown response from publishPrice: ${JSON.stringify(priceUpdateDetail)}`
      );
    }
  }
}
const FEE_TAX_BREAKDOWN_API_BASE_URL = `${API_HOST$2}/Cars/dealerdashboard/api/GetFeeTaxBreakdown.action`;
const sum = (values) => values.reduce((total, value) => total + value, 0);
async function fetchFeeTaxBreakdown(serviceProviderId) {
  try {
    const params = new URLSearchParams();
    params.append("serviceProviderId", `sp${serviceProviderId}`);
    const response = await authFh.get(
      `${FEE_TAX_BREAKDOWN_API_BASE_URL}?${params.toString()}`
    );
    const feesByVehicleCondition = (response == null ? void 0 : response.feesByVehicleCondition) ?? {};
    const feeAmountByVehicleCondition = {
      NEW: sum(feesByVehicleCondition.NEW ?? []),
      USED: sum(feesByVehicleCondition.USED ?? []),
      CPO: sum(feesByVehicleCondition.CPO ?? [])
    };
    return {
      noFees: (response == null ? void 0 : response.noFees) ?? false,
      inventoryFeedIncludesFees: (response == null ? void 0 : response.inventoryFeedIncludesFees) ?? false,
      feeAmountByVehicleCondition
    };
  } catch (error2) {
    throw getErrorWithMessage(
      error2,
      "There was an unexpected error fetching fee tax breakdown"
    );
  }
}
const INVENTORY_SETTINGS_API_BASE_URL = `${API_HOST$2}/Cars/dealerdashboard/api/GetOnboardingPricingToolApi.action`;
async function fetchInventorySettings(serviceProviderId) {
  try {
    const params = new URLSearchParams();
    params.append("serviceProviderId", `sp${serviceProviderId}`);
    const response = await authFh.get(
      `${INVENTORY_SETTINGS_API_BASE_URL}?${params.toString()}`
    );
    return response ?? {};
  } catch (error2) {
    throw getErrorWithMessage(
      error2,
      "There was an unexpected error fetching inventory settings"
    );
  }
}
function getDefaultExportFromCjs(x2) {
  return x2 && x2.__esModule && Object.prototype.hasOwnProperty.call(x2, "default") ? x2["default"] : x2;
}
var react = { exports: {} };
var react_production_min = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$2 = Symbol.for("react.element"), n = Symbol.for("react.portal"), p$4 = Symbol.for("react.fragment"), q = Symbol.for("react.strict_mode"), r$3 = Symbol.for("react.profiler"), t$2 = Symbol.for("react.provider"), u$2 = Symbol.for("react.context"), v$1 = Symbol.for("react.forward_ref"), w$1 = Symbol.for("react.suspense"), x$1 = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z$1 = Symbol.iterator;
function A$2(a2) {
  if (null === a2 || "object" !== typeof a2) return null;
  a2 = z$1 && a2[z$1] || a2["@@iterator"];
  return "function" === typeof a2 ? a2 : null;
}
var B$1 = { isMounted: function() {
  return false;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, C$1 = Object.assign, D$1 = {};
function E$1(a2, b, e) {
  this.props = a2;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
E$1.prototype.isReactComponent = {};
E$1.prototype.setState = function(a2, b) {
  if ("object" !== typeof a2 && "function" !== typeof a2 && null != a2) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, a2, b, "setState");
};
E$1.prototype.forceUpdate = function(a2) {
  this.updater.enqueueForceUpdate(this, a2, "forceUpdate");
};
function F() {
}
F.prototype = E$1.prototype;
function G$2(a2, b, e) {
  this.props = a2;
  this.context = b;
  this.refs = D$1;
  this.updater = e || B$1;
}
var H$1 = G$2.prototype = new F();
H$1.constructor = G$2;
C$1(H$1, E$1.prototype);
H$1.isPureReactComponent = true;
var I$3 = Array.isArray, J = Object.prototype.hasOwnProperty, K$1 = { current: null }, L$2 = { key: true, ref: true, __self: true, __source: true };
function M$1(a2, b, e) {
  var d2, c = {}, k = null, h = null;
  if (null != b) for (d2 in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d2) && !L$2.hasOwnProperty(d2) && (c[d2] = b[d2]);
  var g2 = arguments.length - 2;
  if (1 === g2) c.children = e;
  else if (1 < g2) {
    for (var f2 = Array(g2), m2 = 0; m2 < g2; m2++) f2[m2] = arguments[m2 + 2];
    c.children = f2;
  }
  if (a2 && a2.defaultProps) for (d2 in g2 = a2.defaultProps, g2) void 0 === c[d2] && (c[d2] = g2[d2]);
  return { $$typeof: l$2, type: a2, key: k, ref: h, props: c, _owner: K$1.current };
}
function N$1(a2, b) {
  return { $$typeof: l$2, type: a2.type, key: b, ref: a2.ref, props: a2.props, _owner: a2._owner };
}
function O$1(a2) {
  return "object" === typeof a2 && null !== a2 && a2.$$typeof === l$2;
}
function escape(a2) {
  var b = { "=": "=0", ":": "=2" };
  return "$" + a2.replace(/[=:]/g, function(a3) {
    return b[a3];
  });
}
var P$2 = /\/+/g;
function Q$1(a2, b) {
  return "object" === typeof a2 && null !== a2 && null != a2.key ? escape("" + a2.key) : b.toString(36);
}
function R$1(a2, b, e, d2, c) {
  var k = typeof a2;
  if ("undefined" === k || "boolean" === k) a2 = null;
  var h = false;
  if (null === a2) h = true;
  else switch (k) {
    case "string":
    case "number":
      h = true;
      break;
    case "object":
      switch (a2.$$typeof) {
        case l$2:
        case n:
          h = true;
      }
  }
  if (h) return h = a2, c = c(h), a2 = "" === d2 ? "." + Q$1(h, 0) : d2, I$3(c) ? (e = "", null != a2 && (e = a2.replace(P$2, "$&/") + "/"), R$1(c, b, e, "", function(a3) {
    return a3;
  })) : null != c && (O$1(c) && (c = N$1(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P$2, "$&/") + "/") + a2)), b.push(c)), 1;
  h = 0;
  d2 = "" === d2 ? "." : d2 + ":";
  if (I$3(a2)) for (var g2 = 0; g2 < a2.length; g2++) {
    k = a2[g2];
    var f2 = d2 + Q$1(k, g2);
    h += R$1(k, b, e, f2, c);
  }
  else if (f2 = A$2(a2), "function" === typeof f2) for (a2 = f2.call(a2), g2 = 0; !(k = a2.next()).done; ) k = k.value, f2 = d2 + Q$1(k, g2++), h += R$1(k, b, e, f2, c);
  else if ("object" === k) throw b = String(a2), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a2).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
  return h;
}
function S$2(a2, b, e) {
  if (null == a2) return a2;
  var d2 = [], c = 0;
  R$1(a2, d2, "", "", function(a3) {
    return b.call(e, a3, c++);
  });
  return d2;
}
function T$1(a2) {
  if (-1 === a2._status) {
    var b = a2._result;
    b = b();
    b.then(function(b2) {
      if (0 === a2._status || -1 === a2._status) a2._status = 1, a2._result = b2;
    }, function(b2) {
      if (0 === a2._status || -1 === a2._status) a2._status = 2, a2._result = b2;
    });
    -1 === a2._status && (a2._status = 0, a2._result = b);
  }
  if (1 === a2._status) return a2._result.default;
  throw a2._result;
}
var U$1 = { current: null }, V$1 = { transition: null }, W$1 = { ReactCurrentDispatcher: U$1, ReactCurrentBatchConfig: V$1, ReactCurrentOwner: K$1 };
react_production_min.Children = { map: S$2, forEach: function(a2, b, e) {
  S$2(a2, function() {
    b.apply(this, arguments);
  }, e);
}, count: function(a2) {
  var b = 0;
  S$2(a2, function() {
    b++;
  });
  return b;
}, toArray: function(a2) {
  return S$2(a2, function(a3) {
    return a3;
  }) || [];
}, only: function(a2) {
  if (!O$1(a2)) throw Error("React.Children.only expected to receive a single React element child.");
  return a2;
} };
react_production_min.Component = E$1;
react_production_min.Fragment = p$4;
react_production_min.Profiler = r$3;
react_production_min.PureComponent = G$2;
react_production_min.StrictMode = q;
react_production_min.Suspense = w$1;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W$1;
react_production_min.cloneElement = function(a2, b, e) {
  if (null === a2 || void 0 === a2) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a2 + ".");
  var d2 = C$1({}, a2.props), c = a2.key, k = a2.ref, h = a2._owner;
  if (null != b) {
    void 0 !== b.ref && (k = b.ref, h = K$1.current);
    void 0 !== b.key && (c = "" + b.key);
    if (a2.type && a2.type.defaultProps) var g2 = a2.type.defaultProps;
    for (f2 in b) J.call(b, f2) && !L$2.hasOwnProperty(f2) && (d2[f2] = void 0 === b[f2] && void 0 !== g2 ? g2[f2] : b[f2]);
  }
  var f2 = arguments.length - 2;
  if (1 === f2) d2.children = e;
  else if (1 < f2) {
    g2 = Array(f2);
    for (var m2 = 0; m2 < f2; m2++) g2[m2] = arguments[m2 + 2];
    d2.children = g2;
  }
  return { $$typeof: l$2, type: a2.type, key: c, ref: k, props: d2, _owner: h };
};
react_production_min.createContext = function(a2) {
  a2 = { $$typeof: u$2, _currentValue: a2, _currentValue2: a2, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
  a2.Provider = { $$typeof: t$2, _context: a2 };
  return a2.Consumer = a2;
};
react_production_min.createElement = M$1;
react_production_min.createFactory = function(a2) {
  var b = M$1.bind(null, a2);
  b.type = a2;
  return b;
};
react_production_min.createRef = function() {
  return { current: null };
};
react_production_min.forwardRef = function(a2) {
  return { $$typeof: v$1, render: a2 };
};
react_production_min.isValidElement = O$1;
react_production_min.lazy = function(a2) {
  return { $$typeof: y, _payload: { _status: -1, _result: a2 }, _init: T$1 };
};
react_production_min.memo = function(a2, b) {
  return { $$typeof: x$1, type: a2, compare: void 0 === b ? null : b };
};
react_production_min.startTransition = function(a2) {
  var b = V$1.transition;
  V$1.transition = {};
  try {
    a2();
  } finally {
    V$1.transition = b;
  }
};
react_production_min.unstable_act = function() {
  throw Error("act(...) is not supported in production builds of React.");
};
react_production_min.useCallback = function(a2, b) {
  return U$1.current.useCallback(a2, b);
};
react_production_min.useContext = function(a2) {
  return U$1.current.useContext(a2);
};
react_production_min.useDebugValue = function() {
};
react_production_min.useDeferredValue = function(a2) {
  return U$1.current.useDeferredValue(a2);
};
react_production_min.useEffect = function(a2, b) {
  return U$1.current.useEffect(a2, b);
};
react_production_min.useId = function() {
  return U$1.current.useId();
};
react_production_min.useImperativeHandle = function(a2, b, e) {
  return U$1.current.useImperativeHandle(a2, b, e);
};
react_production_min.useInsertionEffect = function(a2, b) {
  return U$1.current.useInsertionEffect(a2, b);
};
react_production_min.useLayoutEffect = function(a2, b) {
  return U$1.current.useLayoutEffect(a2, b);
};
react_production_min.useMemo = function(a2, b) {
  return U$1.current.useMemo(a2, b);
};
react_production_min.useReducer = function(a2, b, e) {
  return U$1.current.useReducer(a2, b, e);
};
react_production_min.useRef = function(a2) {
  return U$1.current.useRef(a2);
};
react_production_min.useState = function(a2) {
  return U$1.current.useState(a2);
};
react_production_min.useSyncExternalStore = function(a2, b, e) {
  return U$1.current.useSyncExternalStore(a2, b, e);
};
react_production_min.useTransition = function() {
  return U$1.current.useTransition();
};
react_production_min.version = "18.2.0";
{
  react.exports = react_production_min;
}
var reactExports = react.exports;
const React__default = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
const React = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: React__default
}, [reactExports]);
function _extends$2() {
  return _extends$2 = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e = 1; e < arguments.length; e++) {
      var t2 = arguments[e];
      for (var r2 in t2) ({}).hasOwnProperty.call(t2, r2) && (n2[r2] = t2[r2]);
    }
    return n2;
  }, _extends$2.apply(null, arguments);
}
function $6ed0406888f73fc4$var$setRef$2(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref !== null && ref !== void 0) ref.current = value;
}
function $6ed0406888f73fc4$export$43e446d32b3d21af$2(...refs) {
  return (node) => refs.forEach(
    (ref) => $6ed0406888f73fc4$var$setRef$2(ref, node)
  );
}
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(exports) {
  function f2(a2, b) {
    var c = a2.length;
    a2.push(b);
    a: for (; 0 < c; ) {
      var d2 = c - 1 >>> 1, e = a2[d2];
      if (0 < g2(e, b)) a2[d2] = b, a2[c] = e, c = d2;
      else break a;
    }
  }
  function h(a2) {
    return 0 === a2.length ? null : a2[0];
  }
  function k(a2) {
    if (0 === a2.length) return null;
    var b = a2[0], c = a2.pop();
    if (c !== b) {
      a2[0] = c;
      a: for (var d2 = 0, e = a2.length, w2 = e >>> 1; d2 < w2; ) {
        var m2 = 2 * (d2 + 1) - 1, C2 = a2[m2], n2 = m2 + 1, x2 = a2[n2];
        if (0 > g2(C2, c)) n2 < e && 0 > g2(x2, C2) ? (a2[d2] = x2, a2[n2] = c, d2 = n2) : (a2[d2] = C2, a2[m2] = c, d2 = m2);
        else if (n2 < e && 0 > g2(x2, c)) a2[d2] = x2, a2[n2] = c, d2 = n2;
        else break a;
      }
    }
    return b;
  }
  function g2(a2, b) {
    var c = a2.sortIndex - b.sortIndex;
    return 0 !== c ? c : a2.id - b.id;
  }
  if ("object" === typeof performance && "function" === typeof performance.now) {
    var l2 = performance;
    exports.unstable_now = function() {
      return l2.now();
    };
  } else {
    var p2 = Date, q2 = p2.now();
    exports.unstable_now = function() {
      return p2.now() - q2;
    };
  }
  var r2 = [], t2 = [], u2 = 1, v2 = null, y2 = 3, z2 = false, A2 = false, B2 = false, D2 = "function" === typeof setTimeout ? setTimeout : null, E2 = "function" === typeof clearTimeout ? clearTimeout : null, F2 = "undefined" !== typeof setImmediate ? setImmediate : null;
  "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function G2(a2) {
    for (var b = h(t2); null !== b; ) {
      if (null === b.callback) k(t2);
      else if (b.startTime <= a2) k(t2), b.sortIndex = b.expirationTime, f2(r2, b);
      else break;
      b = h(t2);
    }
  }
  function H2(a2) {
    B2 = false;
    G2(a2);
    if (!A2) if (null !== h(r2)) A2 = true, I2(J2);
    else {
      var b = h(t2);
      null !== b && K2(H2, b.startTime - a2);
    }
  }
  function J2(a2, b) {
    A2 = false;
    B2 && (B2 = false, E2(L2), L2 = -1);
    z2 = true;
    var c = y2;
    try {
      G2(b);
      for (v2 = h(r2); null !== v2 && (!(v2.expirationTime > b) || a2 && !M2()); ) {
        var d2 = v2.callback;
        if ("function" === typeof d2) {
          v2.callback = null;
          y2 = v2.priorityLevel;
          var e = d2(v2.expirationTime <= b);
          b = exports.unstable_now();
          "function" === typeof e ? v2.callback = e : v2 === h(r2) && k(r2);
          G2(b);
        } else k(r2);
        v2 = h(r2);
      }
      if (null !== v2) var w2 = true;
      else {
        var m2 = h(t2);
        null !== m2 && K2(H2, m2.startTime - b);
        w2 = false;
      }
      return w2;
    } finally {
      v2 = null, y2 = c, z2 = false;
    }
  }
  var N2 = false, O2 = null, L2 = -1, P2 = 5, Q2 = -1;
  function M2() {
    return exports.unstable_now() - Q2 < P2 ? false : true;
  }
  function R2() {
    if (null !== O2) {
      var a2 = exports.unstable_now();
      Q2 = a2;
      var b = true;
      try {
        b = O2(true, a2);
      } finally {
        b ? S2() : (N2 = false, O2 = null);
      }
    } else N2 = false;
  }
  var S2;
  if ("function" === typeof F2) S2 = function() {
    F2(R2);
  };
  else if ("undefined" !== typeof MessageChannel) {
    var T2 = new MessageChannel(), U2 = T2.port2;
    T2.port1.onmessage = R2;
    S2 = function() {
      U2.postMessage(null);
    };
  } else S2 = function() {
    D2(R2, 0);
  };
  function I2(a2) {
    O2 = a2;
    N2 || (N2 = true, S2());
  }
  function K2(a2, b) {
    L2 = D2(function() {
      a2(exports.unstable_now());
    }, b);
  }
  exports.unstable_IdlePriority = 5;
  exports.unstable_ImmediatePriority = 1;
  exports.unstable_LowPriority = 4;
  exports.unstable_NormalPriority = 3;
  exports.unstable_Profiling = null;
  exports.unstable_UserBlockingPriority = 2;
  exports.unstable_cancelCallback = function(a2) {
    a2.callback = null;
  };
  exports.unstable_continueExecution = function() {
    A2 || z2 || (A2 = true, I2(J2));
  };
  exports.unstable_forceFrameRate = function(a2) {
    0 > a2 || 125 < a2 ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P2 = 0 < a2 ? Math.floor(1e3 / a2) : 5;
  };
  exports.unstable_getCurrentPriorityLevel = function() {
    return y2;
  };
  exports.unstable_getFirstCallbackNode = function() {
    return h(r2);
  };
  exports.unstable_next = function(a2) {
    switch (y2) {
      case 1:
      case 2:
      case 3:
        var b = 3;
        break;
      default:
        b = y2;
    }
    var c = y2;
    y2 = b;
    try {
      return a2();
    } finally {
      y2 = c;
    }
  };
  exports.unstable_pauseExecution = function() {
  };
  exports.unstable_requestPaint = function() {
  };
  exports.unstable_runWithPriority = function(a2, b) {
    switch (a2) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        a2 = 3;
    }
    var c = y2;
    y2 = a2;
    try {
      return b();
    } finally {
      y2 = c;
    }
  };
  exports.unstable_scheduleCallback = function(a2, b, c) {
    var d2 = exports.unstable_now();
    "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d2 + c : d2) : c = d2;
    switch (a2) {
      case 1:
        var e = -1;
        break;
      case 2:
        e = 250;
        break;
      case 5:
        e = 1073741823;
        break;
      case 4:
        e = 1e4;
        break;
      default:
        e = 5e3;
    }
    e = c + e;
    a2 = { id: u2++, callback: b, priorityLevel: a2, startTime: c, expirationTime: e, sortIndex: -1 };
    c > d2 ? (a2.sortIndex = c, f2(t2, a2), null === h(r2) && a2 === h(t2) && (B2 ? (E2(L2), L2 = -1) : B2 = true, K2(H2, c - d2))) : (a2.sortIndex = e, f2(r2, a2), A2 || z2 || (A2 = true, I2(J2)));
    return a2;
  };
  exports.unstable_shouldYield = M2;
  exports.unstable_wrapCallback = function(a2) {
    var b = y2;
    return function() {
      var c = y2;
      y2 = b;
      try {
        return a2.apply(this, arguments);
      } finally {
        y2 = c;
      }
    };
  };
})(scheduler_production_min);
{
  scheduler.exports = scheduler_production_min;
}
var schedulerExports = scheduler.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa = reactExports, ca = schedulerExports;
function p$3(a2) {
  for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a2, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
  return "Minified React error #" + a2 + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var da = /* @__PURE__ */ new Set(), ea = {};
function fa(a2, b) {
  ha(a2, b);
  ha(a2 + "Capture", b);
}
function ha(a2, b) {
  ea[a2] = b;
  for (a2 = 0; a2 < b.length; a2++) da.add(b[a2]);
}
var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma$1 = {};
function oa(a2) {
  if (ja.call(ma$1, a2)) return true;
  if (ja.call(la, a2)) return false;
  if (ka.test(a2)) return ma$1[a2] = true;
  la[a2] = true;
  return false;
}
function pa(a2, b, c, d2) {
  if (null !== c && 0 === c.type) return false;
  switch (typeof b) {
    case "function":
    case "symbol":
      return true;
    case "boolean":
      if (d2) return false;
      if (null !== c) return !c.acceptsBooleans;
      a2 = a2.toLowerCase().slice(0, 5);
      return "data-" !== a2 && "aria-" !== a2;
    default:
      return false;
  }
}
function qa(a2, b, c, d2) {
  if (null === b || "undefined" === typeof b || pa(a2, b, c, d2)) return true;
  if (d2) return false;
  if (null !== c) switch (c.type) {
    case 3:
      return !b;
    case 4:
      return false === b;
    case 5:
      return isNaN(b);
    case 6:
      return isNaN(b) || 1 > b;
  }
  return false;
}
function v(a2, b, c, d2, e, f2, g2) {
  this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
  this.attributeName = d2;
  this.attributeNamespace = e;
  this.mustUseProperty = c;
  this.propertyName = a2;
  this.type = b;
  this.sanitizeURL = f2;
  this.removeEmptyString = g2;
}
var z = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a2) {
  z[a2] = new v(a2, 0, false, a2, null, false, false);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a2) {
  var b = a2[0];
  z[b] = new v(b, 1, false, a2[1], null, false, false);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a2) {
  z[a2] = new v(a2, 2, false, a2.toLowerCase(), null, false, false);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a2) {
  z[a2] = new v(a2, 2, false, a2, null, false, false);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a2) {
  z[a2] = new v(a2, 3, false, a2.toLowerCase(), null, false, false);
});
["checked", "multiple", "muted", "selected"].forEach(function(a2) {
  z[a2] = new v(a2, 3, true, a2, null, false, false);
});
["capture", "download"].forEach(function(a2) {
  z[a2] = new v(a2, 4, false, a2, null, false, false);
});
["cols", "rows", "size", "span"].forEach(function(a2) {
  z[a2] = new v(a2, 6, false, a2, null, false, false);
});
["rowSpan", "start"].forEach(function(a2) {
  z[a2] = new v(a2, 5, false, a2.toLowerCase(), null, false, false);
});
var ra = /[\-:]([a-z])/g;
function sa(a2) {
  return a2[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a2) {
  var b = a2.replace(
    ra,
    sa
  );
  z[b] = new v(b, 1, false, a2, null, false, false);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a2) {
  var b = a2.replace(ra, sa);
  z[b] = new v(b, 1, false, a2, "http://www.w3.org/1999/xlink", false, false);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(a2) {
  var b = a2.replace(ra, sa);
  z[b] = new v(b, 1, false, a2, "http://www.w3.org/XML/1998/namespace", false, false);
});
["tabIndex", "crossOrigin"].forEach(function(a2) {
  z[a2] = new v(a2, 1, false, a2.toLowerCase(), null, false, false);
});
z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
["src", "href", "action", "formAction"].forEach(function(a2) {
  z[a2] = new v(a2, 1, false, a2.toLowerCase(), null, true, true);
});
function ta(a2, b, c, d2) {
  var e = z.hasOwnProperty(b) ? z[b] : null;
  if (null !== e ? 0 !== e.type : d2 || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d2) && (c = null), d2 || null === e ? oa(b) && (null === c ? a2.removeAttribute(b) : a2.setAttribute(b, "" + c)) : e.mustUseProperty ? a2[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d2 = e.attributeNamespace, null === c ? a2.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d2 ? a2.setAttributeNS(d2, b, c) : a2.setAttribute(b, c)));
}
var ua$1 = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa$1 = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
var Ia$1 = Symbol.for("react.offscreen");
var Ja = Symbol.iterator;
function Ka(a2) {
  if (null === a2 || "object" !== typeof a2) return null;
  a2 = Ja && a2[Ja] || a2["@@iterator"];
  return "function" === typeof a2 ? a2 : null;
}
var A$1 = Object.assign, La;
function Ma(a2) {
  if (void 0 === La) try {
    throw Error();
  } catch (c) {
    var b = c.stack.trim().match(/\n( *(at )?)/);
    La = b && b[1] || "";
  }
  return "\n" + La + a2;
}
var Na = false;
function Oa(a2, b) {
  if (!a2 || Na) return "";
  Na = true;
  var c = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (b) if (b = function() {
      throw Error();
    }, Object.defineProperty(b.prototype, "props", { set: function() {
      throw Error();
    } }), "object" === typeof Reflect && Reflect.construct) {
      try {
        Reflect.construct(b, []);
      } catch (l2) {
        var d2 = l2;
      }
      Reflect.construct(a2, [], b);
    } else {
      try {
        b.call();
      } catch (l2) {
        d2 = l2;
      }
      a2.call(b.prototype);
    }
    else {
      try {
        throw Error();
      } catch (l2) {
        d2 = l2;
      }
      a2();
    }
  } catch (l2) {
    if (l2 && d2 && "string" === typeof l2.stack) {
      for (var e = l2.stack.split("\n"), f2 = d2.stack.split("\n"), g2 = e.length - 1, h = f2.length - 1; 1 <= g2 && 0 <= h && e[g2] !== f2[h]; ) h--;
      for (; 1 <= g2 && 0 <= h; g2--, h--) if (e[g2] !== f2[h]) {
        if (1 !== g2 || 1 !== h) {
          do
            if (g2--, h--, 0 > h || e[g2] !== f2[h]) {
              var k = "\n" + e[g2].replace(" at new ", " at ");
              a2.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a2.displayName));
              return k;
            }
          while (1 <= g2 && 0 <= h);
        }
        break;
      }
    }
  } finally {
    Na = false, Error.prepareStackTrace = c;
  }
  return (a2 = a2 ? a2.displayName || a2.name : "") ? Ma(a2) : "";
}
function Pa(a2) {
  switch (a2.tag) {
    case 5:
      return Ma(a2.type);
    case 16:
      return Ma("Lazy");
    case 13:
      return Ma("Suspense");
    case 19:
      return Ma("SuspenseList");
    case 0:
    case 2:
    case 15:
      return a2 = Oa(a2.type, false), a2;
    case 11:
      return a2 = Oa(a2.type.render, false), a2;
    case 1:
      return a2 = Oa(a2.type, true), a2;
    default:
      return "";
  }
}
function Qa(a2) {
  if (null == a2) return null;
  if ("function" === typeof a2) return a2.displayName || a2.name || null;
  if ("string" === typeof a2) return a2;
  switch (a2) {
    case ya:
      return "Fragment";
    case wa$1:
      return "Portal";
    case Aa:
      return "Profiler";
    case za:
      return "StrictMode";
    case Ea:
      return "Suspense";
    case Fa:
      return "SuspenseList";
  }
  if ("object" === typeof a2) switch (a2.$$typeof) {
    case Ca:
      return (a2.displayName || "Context") + ".Consumer";
    case Ba:
      return (a2._context.displayName || "Context") + ".Provider";
    case Da:
      var b = a2.render;
      a2 = a2.displayName;
      a2 || (a2 = b.displayName || b.name || "", a2 = "" !== a2 ? "ForwardRef(" + a2 + ")" : "ForwardRef");
      return a2;
    case Ga:
      return b = a2.displayName || null, null !== b ? b : Qa(a2.type) || "Memo";
    case Ha:
      b = a2._payload;
      a2 = a2._init;
      try {
        return Qa(a2(b));
      } catch (c) {
      }
  }
  return null;
}
function Ra(a2) {
  var b = a2.type;
  switch (a2.tag) {
    case 24:
      return "Cache";
    case 9:
      return (b.displayName || "Context") + ".Consumer";
    case 10:
      return (b._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return a2 = b.render, a2 = a2.displayName || a2.name || "", b.displayName || ("" !== a2 ? "ForwardRef(" + a2 + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return b;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return Qa(b);
    case 8:
      return b === za ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if ("function" === typeof b) return b.displayName || b.name || null;
      if ("string" === typeof b) return b;
  }
  return null;
}
function Sa(a2) {
  switch (typeof a2) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return a2;
    case "object":
      return a2;
    default:
      return "";
  }
}
function Ta(a2) {
  var b = a2.type;
  return (a2 = a2.nodeName) && "input" === a2.toLowerCase() && ("checkbox" === b || "radio" === b);
}
function Ua(a2) {
  var b = Ta(a2) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a2.constructor.prototype, b), d2 = "" + a2[b];
  if (!a2.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
    var e = c.get, f2 = c.set;
    Object.defineProperty(a2, b, { configurable: true, get: function() {
      return e.call(this);
    }, set: function(a3) {
      d2 = "" + a3;
      f2.call(this, a3);
    } });
    Object.defineProperty(a2, b, { enumerable: c.enumerable });
    return { getValue: function() {
      return d2;
    }, setValue: function(a3) {
      d2 = "" + a3;
    }, stopTracking: function() {
      a2._valueTracker = null;
      delete a2[b];
    } };
  }
}
function Va(a2) {
  a2._valueTracker || (a2._valueTracker = Ua(a2));
}
function Wa(a2) {
  if (!a2) return false;
  var b = a2._valueTracker;
  if (!b) return true;
  var c = b.getValue();
  var d2 = "";
  a2 && (d2 = Ta(a2) ? a2.checked ? "true" : "false" : a2.value);
  a2 = d2;
  return a2 !== c ? (b.setValue(a2), true) : false;
}
function Xa(a2) {
  a2 = a2 || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof a2) return null;
  try {
    return a2.activeElement || a2.body;
  } catch (b) {
    return a2.body;
  }
}
function Ya(a2, b) {
  var c = b.checked;
  return A$1({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a2._wrapperState.initialChecked });
}
function Za(a2, b) {
  var c = null == b.defaultValue ? "" : b.defaultValue, d2 = null != b.checked ? b.checked : b.defaultChecked;
  c = Sa(null != b.value ? b.value : c);
  a2._wrapperState = { initialChecked: d2, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
}
function ab(a2, b) {
  b = b.checked;
  null != b && ta(a2, "checked", b, false);
}
function bb(a2, b) {
  ab(a2, b);
  var c = Sa(b.value), d2 = b.type;
  if (null != c) if ("number" === d2) {
    if (0 === c && "" === a2.value || a2.value != c) a2.value = "" + c;
  } else a2.value !== "" + c && (a2.value = "" + c);
  else if ("submit" === d2 || "reset" === d2) {
    a2.removeAttribute("value");
    return;
  }
  b.hasOwnProperty("value") ? cb(a2, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a2, b.type, Sa(b.defaultValue));
  null == b.checked && null != b.defaultChecked && (a2.defaultChecked = !!b.defaultChecked);
}
function db(a2, b, c) {
  if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
    var d2 = b.type;
    if (!("submit" !== d2 && "reset" !== d2 || void 0 !== b.value && null !== b.value)) return;
    b = "" + a2._wrapperState.initialValue;
    c || b === a2.value || (a2.value = b);
    a2.defaultValue = b;
  }
  c = a2.name;
  "" !== c && (a2.name = "");
  a2.defaultChecked = !!a2._wrapperState.initialChecked;
  "" !== c && (a2.name = c);
}
function cb(a2, b, c) {
  if ("number" !== b || Xa(a2.ownerDocument) !== a2) null == c ? a2.defaultValue = "" + a2._wrapperState.initialValue : a2.defaultValue !== "" + c && (a2.defaultValue = "" + c);
}
var eb = Array.isArray;
function fb(a2, b, c, d2) {
  a2 = a2.options;
  if (b) {
    b = {};
    for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
    for (c = 0; c < a2.length; c++) e = b.hasOwnProperty("$" + a2[c].value), a2[c].selected !== e && (a2[c].selected = e), e && d2 && (a2[c].defaultSelected = true);
  } else {
    c = "" + Sa(c);
    b = null;
    for (e = 0; e < a2.length; e++) {
      if (a2[e].value === c) {
        a2[e].selected = true;
        d2 && (a2[e].defaultSelected = true);
        return;
      }
      null !== b || a2[e].disabled || (b = a2[e]);
    }
    null !== b && (b.selected = true);
  }
}
function gb(a2, b) {
  if (null != b.dangerouslySetInnerHTML) throw Error(p$3(91));
  return A$1({}, b, { value: void 0, defaultValue: void 0, children: "" + a2._wrapperState.initialValue });
}
function hb(a2, b) {
  var c = b.value;
  if (null == c) {
    c = b.children;
    b = b.defaultValue;
    if (null != c) {
      if (null != b) throw Error(p$3(92));
      if (eb(c)) {
        if (1 < c.length) throw Error(p$3(93));
        c = c[0];
      }
      b = c;
    }
    null == b && (b = "");
    c = b;
  }
  a2._wrapperState = { initialValue: Sa(c) };
}
function ib(a2, b) {
  var c = Sa(b.value), d2 = Sa(b.defaultValue);
  null != c && (c = "" + c, c !== a2.value && (a2.value = c), null == b.defaultValue && a2.defaultValue !== c && (a2.defaultValue = c));
  null != d2 && (a2.defaultValue = "" + d2);
}
function jb(a2) {
  var b = a2.textContent;
  b === a2._wrapperState.initialValue && "" !== b && null !== b && (a2.value = b);
}
function kb(a2) {
  switch (a2) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function lb(a2, b) {
  return null == a2 || "http://www.w3.org/1999/xhtml" === a2 ? kb(b) : "http://www.w3.org/2000/svg" === a2 && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a2;
}
var mb, nb = function(a2) {
  return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d2, e) {
    MSApp.execUnsafeLocalFunction(function() {
      return a2(b, c, d2, e);
    });
  } : a2;
}(function(a2, b) {
  if ("http://www.w3.org/2000/svg" !== a2.namespaceURI || "innerHTML" in a2) a2.innerHTML = b;
  else {
    mb = mb || document.createElement("div");
    mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
    for (b = mb.firstChild; a2.firstChild; ) a2.removeChild(a2.firstChild);
    for (; b.firstChild; ) a2.appendChild(b.firstChild);
  }
});
function ob(a2, b) {
  if (b) {
    var c = a2.firstChild;
    if (c && c === a2.lastChild && 3 === c.nodeType) {
      c.nodeValue = b;
      return;
    }
  }
  a2.textContent = b;
}
var pb = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
}, qb = ["Webkit", "ms", "Moz", "O"];
Object.keys(pb).forEach(function(a2) {
  qb.forEach(function(b) {
    b = b + a2.charAt(0).toUpperCase() + a2.substring(1);
    pb[b] = pb[a2];
  });
});
function rb(a2, b, c) {
  return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a2) && pb[a2] ? ("" + b).trim() : b + "px";
}
function sb(a2, b) {
  a2 = a2.style;
  for (var c in b) if (b.hasOwnProperty(c)) {
    var d2 = 0 === c.indexOf("--"), e = rb(c, b[c], d2);
    "float" === c && (c = "cssFloat");
    d2 ? a2.setProperty(c, e) : a2[c] = e;
  }
}
var tb = A$1({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
function ub(a2, b) {
  if (b) {
    if (tb[a2] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p$3(137, a2));
    if (null != b.dangerouslySetInnerHTML) {
      if (null != b.children) throw Error(p$3(60));
      if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p$3(61));
    }
    if (null != b.style && "object" !== typeof b.style) throw Error(p$3(62));
  }
}
function vb(a2, b) {
  if (-1 === a2.indexOf("-")) return "string" === typeof b.is;
  switch (a2) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;
    default:
      return true;
  }
}
var wb = null;
function xb(a2) {
  a2 = a2.target || a2.srcElement || window;
  a2.correspondingUseElement && (a2 = a2.correspondingUseElement);
  return 3 === a2.nodeType ? a2.parentNode : a2;
}
var yb = null, zb = null, Ab = null;
function Bb(a2) {
  if (a2 = Cb(a2)) {
    if ("function" !== typeof yb) throw Error(p$3(280));
    var b = a2.stateNode;
    b && (b = Db(b), yb(a2.stateNode, a2.type, b));
  }
}
function Eb(a2) {
  zb ? Ab ? Ab.push(a2) : Ab = [a2] : zb = a2;
}
function Fb() {
  if (zb) {
    var a2 = zb, b = Ab;
    Ab = zb = null;
    Bb(a2);
    if (b) for (a2 = 0; a2 < b.length; a2++) Bb(b[a2]);
  }
}
function Gb(a2, b) {
  return a2(b);
}
function Hb() {
}
var Ib = false;
function Jb(a2, b, c) {
  if (Ib) return a2(b, c);
  Ib = true;
  try {
    return Gb(a2, b, c);
  } finally {
    if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
  }
}
function Kb(a2, b) {
  var c = a2.stateNode;
  if (null === c) return null;
  var d2 = Db(c);
  if (null === d2) return null;
  c = d2[b];
  a: switch (b) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (d2 = !d2.disabled) || (a2 = a2.type, d2 = !("button" === a2 || "input" === a2 || "select" === a2 || "textarea" === a2));
      a2 = !d2;
      break a;
    default:
      a2 = false;
  }
  if (a2) return null;
  if (c && "function" !== typeof c) throw Error(p$3(231, b, typeof c));
  return c;
}
var Lb = false;
if (ia) try {
  var Mb = {};
  Object.defineProperty(Mb, "passive", { get: function() {
    Lb = true;
  } });
  window.addEventListener("test", Mb, Mb);
  window.removeEventListener("test", Mb, Mb);
} catch (a2) {
  Lb = false;
}
function Nb(a2, b, c, d2, e, f2, g2, h, k) {
  var l2 = Array.prototype.slice.call(arguments, 3);
  try {
    b.apply(c, l2);
  } catch (m2) {
    this.onError(m2);
  }
}
var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a2) {
  Ob = true;
  Pb = a2;
} };
function Tb(a2, b, c, d2, e, f2, g2, h, k) {
  Ob = false;
  Pb = null;
  Nb.apply(Sb, arguments);
}
function Ub(a2, b, c, d2, e, f2, g2, h, k) {
  Tb.apply(this, arguments);
  if (Ob) {
    if (Ob) {
      var l2 = Pb;
      Ob = false;
      Pb = null;
    } else throw Error(p$3(198));
    Qb || (Qb = true, Rb = l2);
  }
}
function Vb(a2) {
  var b = a2, c = a2;
  if (a2.alternate) for (; b.return; ) b = b.return;
  else {
    a2 = b;
    do
      b = a2, 0 !== (b.flags & 4098) && (c = b.return), a2 = b.return;
    while (a2);
  }
  return 3 === b.tag ? c : null;
}
function Wb(a2) {
  if (13 === a2.tag) {
    var b = a2.memoizedState;
    null === b && (a2 = a2.alternate, null !== a2 && (b = a2.memoizedState));
    if (null !== b) return b.dehydrated;
  }
  return null;
}
function Xb(a2) {
  if (Vb(a2) !== a2) throw Error(p$3(188));
}
function Yb(a2) {
  var b = a2.alternate;
  if (!b) {
    b = Vb(a2);
    if (null === b) throw Error(p$3(188));
    return b !== a2 ? null : a2;
  }
  for (var c = a2, d2 = b; ; ) {
    var e = c.return;
    if (null === e) break;
    var f2 = e.alternate;
    if (null === f2) {
      d2 = e.return;
      if (null !== d2) {
        c = d2;
        continue;
      }
      break;
    }
    if (e.child === f2.child) {
      for (f2 = e.child; f2; ) {
        if (f2 === c) return Xb(e), a2;
        if (f2 === d2) return Xb(e), b;
        f2 = f2.sibling;
      }
      throw Error(p$3(188));
    }
    if (c.return !== d2.return) c = e, d2 = f2;
    else {
      for (var g2 = false, h = e.child; h; ) {
        if (h === c) {
          g2 = true;
          c = e;
          d2 = f2;
          break;
        }
        if (h === d2) {
          g2 = true;
          d2 = e;
          c = f2;
          break;
        }
        h = h.sibling;
      }
      if (!g2) {
        for (h = f2.child; h; ) {
          if (h === c) {
            g2 = true;
            c = f2;
            d2 = e;
            break;
          }
          if (h === d2) {
            g2 = true;
            d2 = f2;
            c = e;
            break;
          }
          h = h.sibling;
        }
        if (!g2) throw Error(p$3(189));
      }
    }
    if (c.alternate !== d2) throw Error(p$3(190));
  }
  if (3 !== c.tag) throw Error(p$3(188));
  return c.stateNode.current === c ? a2 : b;
}
function Zb(a2) {
  a2 = Yb(a2);
  return null !== a2 ? $b(a2) : null;
}
function $b(a2) {
  if (5 === a2.tag || 6 === a2.tag) return a2;
  for (a2 = a2.child; null !== a2; ) {
    var b = $b(a2);
    if (null !== b) return b;
    a2 = a2.sibling;
  }
  return null;
}
var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
function mc(a2) {
  if (lc && "function" === typeof lc.onCommitFiberRoot) try {
    lc.onCommitFiberRoot(kc, a2, void 0, 128 === (a2.current.flags & 128));
  } catch (b) {
  }
}
var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
function nc(a2) {
  a2 >>>= 0;
  return 0 === a2 ? 32 : 31 - (pc(a2) / qc | 0) | 0;
}
var rc = 64, sc = 4194304;
function tc(a2) {
  switch (a2 & -a2) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return a2 & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return a2 & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return a2;
  }
}
function uc(a2, b) {
  var c = a2.pendingLanes;
  if (0 === c) return 0;
  var d2 = 0, e = a2.suspendedLanes, f2 = a2.pingedLanes, g2 = c & 268435455;
  if (0 !== g2) {
    var h = g2 & ~e;
    0 !== h ? d2 = tc(h) : (f2 &= g2, 0 !== f2 && (d2 = tc(f2)));
  } else g2 = c & ~e, 0 !== g2 ? d2 = tc(g2) : 0 !== f2 && (d2 = tc(f2));
  if (0 === d2) return 0;
  if (0 !== b && b !== d2 && 0 === (b & e) && (e = d2 & -d2, f2 = b & -b, e >= f2 || 16 === e && 0 !== (f2 & 4194240))) return b;
  0 !== (d2 & 4) && (d2 |= c & 16);
  b = a2.entangledLanes;
  if (0 !== b) for (a2 = a2.entanglements, b &= d2; 0 < b; ) c = 31 - oc(b), e = 1 << c, d2 |= a2[c], b &= ~e;
  return d2;
}
function vc(a2, b) {
  switch (a2) {
    case 1:
    case 2:
    case 4:
      return b + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return b + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function wc(a2, b) {
  for (var c = a2.suspendedLanes, d2 = a2.pingedLanes, e = a2.expirationTimes, f2 = a2.pendingLanes; 0 < f2; ) {
    var g2 = 31 - oc(f2), h = 1 << g2, k = e[g2];
    if (-1 === k) {
      if (0 === (h & c) || 0 !== (h & d2)) e[g2] = vc(h, b);
    } else k <= b && (a2.expiredLanes |= h);
    f2 &= ~h;
  }
}
function xc(a2) {
  a2 = a2.pendingLanes & -1073741825;
  return 0 !== a2 ? a2 : a2 & 1073741824 ? 1073741824 : 0;
}
function yc() {
  var a2 = rc;
  rc <<= 1;
  0 === (rc & 4194240) && (rc = 64);
  return a2;
}
function zc(a2) {
  for (var b = [], c = 0; 31 > c; c++) b.push(a2);
  return b;
}
function Ac(a2, b, c) {
  a2.pendingLanes |= b;
  536870912 !== b && (a2.suspendedLanes = 0, a2.pingedLanes = 0);
  a2 = a2.eventTimes;
  b = 31 - oc(b);
  a2[b] = c;
}
function Bc(a2, b) {
  var c = a2.pendingLanes & ~b;
  a2.pendingLanes = b;
  a2.suspendedLanes = 0;
  a2.pingedLanes = 0;
  a2.expiredLanes &= b;
  a2.mutableReadLanes &= b;
  a2.entangledLanes &= b;
  b = a2.entanglements;
  var d2 = a2.eventTimes;
  for (a2 = a2.expirationTimes; 0 < c; ) {
    var e = 31 - oc(c), f2 = 1 << e;
    b[e] = 0;
    d2[e] = -1;
    a2[e] = -1;
    c &= ~f2;
  }
}
function Cc(a2, b) {
  var c = a2.entangledLanes |= b;
  for (a2 = a2.entanglements; c; ) {
    var d2 = 31 - oc(c), e = 1 << d2;
    e & b | a2[d2] & b && (a2[d2] |= b);
    c &= ~e;
  }
}
var C = 0;
function Dc(a2) {
  a2 &= -a2;
  return 1 < a2 ? 4 < a2 ? 0 !== (a2 & 268435455) ? 16 : 536870912 : 4 : 1;
}
var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a2, b) {
  switch (a2) {
    case "focusin":
    case "focusout":
      Lc = null;
      break;
    case "dragenter":
    case "dragleave":
      Mc = null;
      break;
    case "mouseover":
    case "mouseout":
      Nc = null;
      break;
    case "pointerover":
    case "pointerout":
      Oc.delete(b.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Pc.delete(b.pointerId);
  }
}
function Tc(a2, b, c, d2, e, f2) {
  if (null === a2 || a2.nativeEvent !== f2) return a2 = { blockedOn: b, domEventName: c, eventSystemFlags: d2, nativeEvent: f2, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a2;
  a2.eventSystemFlags |= d2;
  b = a2.targetContainers;
  null !== e && -1 === b.indexOf(e) && b.push(e);
  return a2;
}
function Uc(a2, b, c, d2, e) {
  switch (b) {
    case "focusin":
      return Lc = Tc(Lc, a2, b, c, d2, e), true;
    case "dragenter":
      return Mc = Tc(Mc, a2, b, c, d2, e), true;
    case "mouseover":
      return Nc = Tc(Nc, a2, b, c, d2, e), true;
    case "pointerover":
      var f2 = e.pointerId;
      Oc.set(f2, Tc(Oc.get(f2) || null, a2, b, c, d2, e));
      return true;
    case "gotpointercapture":
      return f2 = e.pointerId, Pc.set(f2, Tc(Pc.get(f2) || null, a2, b, c, d2, e)), true;
  }
  return false;
}
function Vc(a2) {
  var b = Wc(a2.target);
  if (null !== b) {
    var c = Vb(b);
    if (null !== c) {
      if (b = c.tag, 13 === b) {
        if (b = Wb(c), null !== b) {
          a2.blockedOn = b;
          Ic(a2.priority, function() {
            Gc(c);
          });
          return;
        }
      } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
        a2.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
        return;
      }
    }
  }
  a2.blockedOn = null;
}
function Xc(a2) {
  if (null !== a2.blockedOn) return false;
  for (var b = a2.targetContainers; 0 < b.length; ) {
    var c = Yc(a2.domEventName, a2.eventSystemFlags, b[0], a2.nativeEvent);
    if (null === c) {
      c = a2.nativeEvent;
      var d2 = new c.constructor(c.type, c);
      wb = d2;
      c.target.dispatchEvent(d2);
      wb = null;
    } else return b = Cb(c), null !== b && Fc(b), a2.blockedOn = c, false;
    b.shift();
  }
  return true;
}
function Zc(a2, b, c) {
  Xc(a2) && c.delete(b);
}
function $c() {
  Jc = false;
  null !== Lc && Xc(Lc) && (Lc = null);
  null !== Mc && Xc(Mc) && (Mc = null);
  null !== Nc && Xc(Nc) && (Nc = null);
  Oc.forEach(Zc);
  Pc.forEach(Zc);
}
function ad(a2, b) {
  a2.blockedOn === b && (a2.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
}
function bd(a2) {
  function b(b2) {
    return ad(b2, a2);
  }
  if (0 < Kc.length) {
    ad(Kc[0], a2);
    for (var c = 1; c < Kc.length; c++) {
      var d2 = Kc[c];
      d2.blockedOn === a2 && (d2.blockedOn = null);
    }
  }
  null !== Lc && ad(Lc, a2);
  null !== Mc && ad(Mc, a2);
  null !== Nc && ad(Nc, a2);
  Oc.forEach(b);
  Pc.forEach(b);
  for (c = 0; c < Qc.length; c++) d2 = Qc[c], d2.blockedOn === a2 && (d2.blockedOn = null);
  for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
}
var cd = ua$1.ReactCurrentBatchConfig, dd = true;
function ed(a2, b, c, d2) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 1, fd(a2, b, c, d2);
  } finally {
    C = e, cd.transition = f2;
  }
}
function gd(a2, b, c, d2) {
  var e = C, f2 = cd.transition;
  cd.transition = null;
  try {
    C = 4, fd(a2, b, c, d2);
  } finally {
    C = e, cd.transition = f2;
  }
}
function fd(a2, b, c, d2) {
  if (dd) {
    var e = Yc(a2, b, c, d2);
    if (null === e) hd(a2, b, d2, id, c), Sc(a2, d2);
    else if (Uc(e, a2, b, c, d2)) d2.stopPropagation();
    else if (Sc(a2, d2), b & 4 && -1 < Rc.indexOf(a2)) {
      for (; null !== e; ) {
        var f2 = Cb(e);
        null !== f2 && Ec(f2);
        f2 = Yc(a2, b, c, d2);
        null === f2 && hd(a2, b, d2, id, c);
        if (f2 === e) break;
        e = f2;
      }
      null !== e && d2.stopPropagation();
    } else hd(a2, b, d2, null, c);
  }
}
var id = null;
function Yc(a2, b, c, d2) {
  id = null;
  a2 = xb(d2);
  a2 = Wc(a2);
  if (null !== a2) if (b = Vb(a2), null === b) a2 = null;
  else if (c = b.tag, 13 === c) {
    a2 = Wb(b);
    if (null !== a2) return a2;
    a2 = null;
  } else if (3 === c) {
    if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
    a2 = null;
  } else b !== a2 && (a2 = null);
  id = a2;
  return null;
}
function jd(a2) {
  switch (a2) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (ec()) {
        case fc:
          return 1;
        case gc:
          return 4;
        case hc:
        case ic:
          return 16;
        case jc:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var kd = null, ld = null, md = null;
function nd() {
  if (md) return md;
  var a2, b = ld, c = b.length, d2, e = "value" in kd ? kd.value : kd.textContent, f2 = e.length;
  for (a2 = 0; a2 < c && b[a2] === e[a2]; a2++) ;
  var g2 = c - a2;
  for (d2 = 1; d2 <= g2 && b[c - d2] === e[f2 - d2]; d2++) ;
  return md = e.slice(a2, 1 < d2 ? 1 - d2 : void 0);
}
function od(a2) {
  var b = a2.keyCode;
  "charCode" in a2 ? (a2 = a2.charCode, 0 === a2 && 13 === b && (a2 = 13)) : a2 = b;
  10 === a2 && (a2 = 13);
  return 32 <= a2 || 13 === a2 ? a2 : 0;
}
function pd() {
  return true;
}
function qd() {
  return false;
}
function rd(a2) {
  function b(b2, d2, e, f2, g2) {
    this._reactName = b2;
    this._targetInst = e;
    this.type = d2;
    this.nativeEvent = f2;
    this.target = g2;
    this.currentTarget = null;
    for (var c in a2) a2.hasOwnProperty(c) && (b2 = a2[c], this[c] = b2 ? b2(f2) : f2[c]);
    this.isDefaultPrevented = (null != f2.defaultPrevented ? f2.defaultPrevented : false === f2.returnValue) ? pd : qd;
    this.isPropagationStopped = qd;
    return this;
  }
  A$1(b.prototype, { preventDefault: function() {
    this.defaultPrevented = true;
    var a3 = this.nativeEvent;
    a3 && (a3.preventDefault ? a3.preventDefault() : "unknown" !== typeof a3.returnValue && (a3.returnValue = false), this.isDefaultPrevented = pd);
  }, stopPropagation: function() {
    var a3 = this.nativeEvent;
    a3 && (a3.stopPropagation ? a3.stopPropagation() : "unknown" !== typeof a3.cancelBubble && (a3.cancelBubble = true), this.isPropagationStopped = pd);
  }, persist: function() {
  }, isPersistent: pd });
  return b;
}
var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a2) {
  return a2.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A$1({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A$1({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a2) {
  return void 0 === a2.relatedTarget ? a2.fromElement === a2.srcElement ? a2.toElement : a2.fromElement : a2.relatedTarget;
}, movementX: function(a2) {
  if ("movementX" in a2) return a2.movementX;
  a2 !== yd && (yd && "mousemove" === a2.type ? (wd = a2.screenX - yd.screenX, xd = a2.screenY - yd.screenY) : xd = wd = 0, yd = a2);
  return wd;
}, movementY: function(a2) {
  return "movementY" in a2 ? a2.movementY : xd;
} }), Bd = rd(Ad), Cd = A$1({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A$1({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A$1({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A$1({}, sd, { clipboardData: function(a2) {
  return "clipboardData" in a2 ? a2.clipboardData : window.clipboardData;
} }), Jd = rd(Id), Kd = A$1({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Nd = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Pd(a2) {
  var b = this.nativeEvent;
  return b.getModifierState ? b.getModifierState(a2) : (a2 = Od[a2]) ? !!b[a2] : false;
}
function zd() {
  return Pd;
}
var Qd = A$1({}, ud, { key: function(a2) {
  if (a2.key) {
    var b = Md[a2.key] || a2.key;
    if ("Unidentified" !== b) return b;
  }
  return "keypress" === a2.type ? (a2 = od(a2), 13 === a2 ? "Enter" : String.fromCharCode(a2)) : "keydown" === a2.type || "keyup" === a2.type ? Nd[a2.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a2) {
  return "keypress" === a2.type ? od(a2) : 0;
}, keyCode: function(a2) {
  return "keydown" === a2.type || "keyup" === a2.type ? a2.keyCode : 0;
}, which: function(a2) {
  return "keypress" === a2.type ? od(a2) : "keydown" === a2.type || "keyup" === a2.type ? a2.keyCode : 0;
} }), Rd = rd(Qd), Sd = A$1({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A$1({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A$1({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A$1({}, Ad, {
  deltaX: function(a2) {
    return "deltaX" in a2 ? a2.deltaX : "wheelDeltaX" in a2 ? -a2.wheelDeltaX : 0;
  },
  deltaY: function(a2) {
    return "deltaY" in a2 ? a2.deltaY : "wheelDeltaY" in a2 ? -a2.wheelDeltaY : "wheelDelta" in a2 ? -a2.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), Zd = rd(Yd), $d = [9, 13, 27, 32], ae = ia && "CompositionEvent" in window, be = null;
ia && "documentMode" in document && (be = document.documentMode);
var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = false;
function ge(a2, b) {
  switch (a2) {
    case "keyup":
      return -1 !== $d.indexOf(b.keyCode);
    case "keydown":
      return 229 !== b.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return true;
    default:
      return false;
  }
}
function he(a2) {
  a2 = a2.detail;
  return "object" === typeof a2 && "data" in a2 ? a2.data : null;
}
var ie = false;
function je(a2, b) {
  switch (a2) {
    case "compositionend":
      return he(b);
    case "keypress":
      if (32 !== b.which) return null;
      fe = true;
      return ee;
    case "textInput":
      return a2 = b.data, a2 === ee && fe ? null : a2;
    default:
      return null;
  }
}
function ke(a2, b) {
  if (ie) return "compositionend" === a2 || !ae && ge(a2, b) ? (a2 = nd(), md = ld = kd = null, ie = false, a2) : null;
  switch (a2) {
    case "paste":
      return null;
    case "keypress":
      if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
        if (b.char && 1 < b.char.length) return b.char;
        if (b.which) return String.fromCharCode(b.which);
      }
      return null;
    case "compositionend":
      return de && "ko" !== b.locale ? null : b.data;
    default:
      return null;
  }
}
var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
function me(a2) {
  var b = a2 && a2.nodeName && a2.nodeName.toLowerCase();
  return "input" === b ? !!le[a2.type] : "textarea" === b ? true : false;
}
function ne(a2, b, c, d2) {
  Eb(d2);
  b = oe(b, "onChange");
  0 < b.length && (c = new td("onChange", "change", null, c, d2), a2.push({ event: c, listeners: b }));
}
var pe = null, qe = null;
function re(a2) {
  se(a2, 0);
}
function te(a2) {
  var b = ue(a2);
  if (Wa(b)) return a2;
}
function ve(a2, b) {
  if ("change" === a2) return b;
}
var we = false;
if (ia) {
  var xe;
  if (ia) {
    var ye = "oninput" in document;
    if (!ye) {
      var ze = document.createElement("div");
      ze.setAttribute("oninput", "return;");
      ye = "function" === typeof ze.oninput;
    }
    xe = ye;
  } else xe = false;
  we = xe && (!document.documentMode || 9 < document.documentMode);
}
function Ae() {
  pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
}
function Be(a2) {
  if ("value" === a2.propertyName && te(qe)) {
    var b = [];
    ne(b, qe, a2, xb(a2));
    Jb(re, b);
  }
}
function Ce(a2, b, c) {
  "focusin" === a2 ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a2 && Ae();
}
function De(a2) {
  if ("selectionchange" === a2 || "keyup" === a2 || "keydown" === a2) return te(qe);
}
function Ee(a2, b) {
  if ("click" === a2) return te(b);
}
function Fe(a2, b) {
  if ("input" === a2 || "change" === a2) return te(b);
}
function Ge(a2, b) {
  return a2 === b && (0 !== a2 || 1 / a2 === 1 / b) || a2 !== a2 && b !== b;
}
var He = "function" === typeof Object.is ? Object.is : Ge;
function Ie(a2, b) {
  if (He(a2, b)) return true;
  if ("object" !== typeof a2 || null === a2 || "object" !== typeof b || null === b) return false;
  var c = Object.keys(a2), d2 = Object.keys(b);
  if (c.length !== d2.length) return false;
  for (d2 = 0; d2 < c.length; d2++) {
    var e = c[d2];
    if (!ja.call(b, e) || !He(a2[e], b[e])) return false;
  }
  return true;
}
function Je(a2) {
  for (; a2 && a2.firstChild; ) a2 = a2.firstChild;
  return a2;
}
function Ke(a2, b) {
  var c = Je(a2);
  a2 = 0;
  for (var d2; c; ) {
    if (3 === c.nodeType) {
      d2 = a2 + c.textContent.length;
      if (a2 <= b && d2 >= b) return { node: c, offset: b - a2 };
      a2 = d2;
    }
    a: {
      for (; c; ) {
        if (c.nextSibling) {
          c = c.nextSibling;
          break a;
        }
        c = c.parentNode;
      }
      c = void 0;
    }
    c = Je(c);
  }
}
function Le(a2, b) {
  return a2 && b ? a2 === b ? true : a2 && 3 === a2.nodeType ? false : b && 3 === b.nodeType ? Le(a2, b.parentNode) : "contains" in a2 ? a2.contains(b) : a2.compareDocumentPosition ? !!(a2.compareDocumentPosition(b) & 16) : false : false;
}
function Me() {
  for (var a2 = window, b = Xa(); b instanceof a2.HTMLIFrameElement; ) {
    try {
      var c = "string" === typeof b.contentWindow.location.href;
    } catch (d2) {
      c = false;
    }
    if (c) a2 = b.contentWindow;
    else break;
    b = Xa(a2.document);
  }
  return b;
}
function Ne(a2) {
  var b = a2 && a2.nodeName && a2.nodeName.toLowerCase();
  return b && ("input" === b && ("text" === a2.type || "search" === a2.type || "tel" === a2.type || "url" === a2.type || "password" === a2.type) || "textarea" === b || "true" === a2.contentEditable);
}
function Oe(a2) {
  var b = Me(), c = a2.focusedElem, d2 = a2.selectionRange;
  if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
    if (null !== d2 && Ne(c)) {
      if (b = d2.start, a2 = d2.end, void 0 === a2 && (a2 = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a2, c.value.length);
      else if (a2 = (b = c.ownerDocument || document) && b.defaultView || window, a2.getSelection) {
        a2 = a2.getSelection();
        var e = c.textContent.length, f2 = Math.min(d2.start, e);
        d2 = void 0 === d2.end ? f2 : Math.min(d2.end, e);
        !a2.extend && f2 > d2 && (e = d2, d2 = f2, f2 = e);
        e = Ke(c, f2);
        var g2 = Ke(
          c,
          d2
        );
        e && g2 && (1 !== a2.rangeCount || a2.anchorNode !== e.node || a2.anchorOffset !== e.offset || a2.focusNode !== g2.node || a2.focusOffset !== g2.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a2.removeAllRanges(), f2 > d2 ? (a2.addRange(b), a2.extend(g2.node, g2.offset)) : (b.setEnd(g2.node, g2.offset), a2.addRange(b)));
      }
    }
    b = [];
    for (a2 = c; a2 = a2.parentNode; ) 1 === a2.nodeType && b.push({ element: a2, left: a2.scrollLeft, top: a2.scrollTop });
    "function" === typeof c.focus && c.focus();
    for (c = 0; c < b.length; c++) a2 = b[c], a2.element.scrollLeft = a2.left, a2.element.scrollTop = a2.top;
  }
}
var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
function Ue(a2, b, c) {
  var d2 = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
  Te || null == Qe || Qe !== Xa(d2) || (d2 = Qe, "selectionStart" in d2 && Ne(d2) ? d2 = { start: d2.selectionStart, end: d2.selectionEnd } : (d2 = (d2.ownerDocument && d2.ownerDocument.defaultView || window).getSelection(), d2 = { anchorNode: d2.anchorNode, anchorOffset: d2.anchorOffset, focusNode: d2.focusNode, focusOffset: d2.focusOffset }), Se && Ie(Se, d2) || (Se = d2, d2 = oe(Re, "onSelect"), 0 < d2.length && (b = new td("onSelect", "select", null, b, c), a2.push({ event: b, listeners: d2 }), b.target = Qe)));
}
function Ve(a2, b) {
  var c = {};
  c[a2.toLowerCase()] = b.toLowerCase();
  c["Webkit" + a2] = "webkit" + b;
  c["Moz" + a2] = "moz" + b;
  return c;
}
var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
function Ze(a2) {
  if (Xe[a2]) return Xe[a2];
  if (!We[a2]) return a2;
  var b = We[a2], c;
  for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a2] = b[c];
  return a2;
}
var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a2, b) {
  df.set(a2, b);
  fa(b, [a2]);
}
for (var gf = 0; gf < ef.length; gf++) {
  var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
  ff(jf, "on" + kf);
}
ff($e, "onAnimationEnd");
ff(af, "onAnimationIteration");
ff(bf, "onAnimationStart");
ff("dblclick", "onDoubleClick");
ff("focusin", "onFocus");
ff("focusout", "onBlur");
ff(cf, "onTransitionEnd");
ha("onMouseEnter", ["mouseout", "mouseover"]);
ha("onMouseLeave", ["mouseout", "mouseover"]);
ha("onPointerEnter", ["pointerout", "pointerover"]);
ha("onPointerLeave", ["pointerout", "pointerover"]);
fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a2, b, c) {
  var d2 = a2.type || "unknown-event";
  a2.currentTarget = c;
  Ub(d2, b, void 0, a2);
  a2.currentTarget = null;
}
function se(a2, b) {
  b = 0 !== (b & 4);
  for (var c = 0; c < a2.length; c++) {
    var d2 = a2[c], e = d2.event;
    d2 = d2.listeners;
    a: {
      var f2 = void 0;
      if (b) for (var g2 = d2.length - 1; 0 <= g2; g2--) {
        var h = d2[g2], k = h.instance, l2 = h.currentTarget;
        h = h.listener;
        if (k !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k;
      }
      else for (g2 = 0; g2 < d2.length; g2++) {
        h = d2[g2];
        k = h.instance;
        l2 = h.currentTarget;
        h = h.listener;
        if (k !== f2 && e.isPropagationStopped()) break a;
        nf(e, h, l2);
        f2 = k;
      }
    }
  }
  if (Qb) throw a2 = Rb, Qb = false, Rb = null, a2;
}
function D(a2, b) {
  var c = b[of];
  void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
  var d2 = a2 + "__bubble";
  c.has(d2) || (pf(b, a2, 2, false), c.add(d2));
}
function qf(a2, b, c) {
  var d2 = 0;
  b && (d2 |= 4);
  pf(c, a2, d2, b);
}
var rf = "_reactListening" + Math.random().toString(36).slice(2);
function sf(a2) {
  if (!a2[rf]) {
    a2[rf] = true;
    da.forEach(function(b2) {
      "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a2), qf(b2, true, a2));
    });
    var b = 9 === a2.nodeType ? a2 : a2.ownerDocument;
    null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
  }
}
function pf(a2, b, c, d2) {
  switch (jd(b)) {
    case 1:
      var e = ed;
      break;
    case 4:
      e = gd;
      break;
    default:
      e = fd;
  }
  c = e.bind(null, b, c, a2);
  e = void 0;
  !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
  d2 ? void 0 !== e ? a2.addEventListener(b, c, { capture: true, passive: e }) : a2.addEventListener(b, c, true) : void 0 !== e ? a2.addEventListener(b, c, { passive: e }) : a2.addEventListener(b, c, false);
}
function hd(a2, b, c, d2, e) {
  var f2 = d2;
  if (0 === (b & 1) && 0 === (b & 2) && null !== d2) a: for (; ; ) {
    if (null === d2) return;
    var g2 = d2.tag;
    if (3 === g2 || 4 === g2) {
      var h = d2.stateNode.containerInfo;
      if (h === e || 8 === h.nodeType && h.parentNode === e) break;
      if (4 === g2) for (g2 = d2.return; null !== g2; ) {
        var k = g2.tag;
        if (3 === k || 4 === k) {
          if (k = g2.stateNode.containerInfo, k === e || 8 === k.nodeType && k.parentNode === e) return;
        }
        g2 = g2.return;
      }
      for (; null !== h; ) {
        g2 = Wc(h);
        if (null === g2) return;
        k = g2.tag;
        if (5 === k || 6 === k) {
          d2 = f2 = g2;
          continue a;
        }
        h = h.parentNode;
      }
    }
    d2 = d2.return;
  }
  Jb(function() {
    var d3 = f2, e2 = xb(c), g3 = [];
    a: {
      var h2 = df.get(a2);
      if (void 0 !== h2) {
        var k2 = td, n2 = a2;
        switch (a2) {
          case "keypress":
            if (0 === od(c)) break a;
          case "keydown":
          case "keyup":
            k2 = Rd;
            break;
          case "focusin":
            n2 = "focus";
            k2 = Fd;
            break;
          case "focusout":
            n2 = "blur";
            k2 = Fd;
            break;
          case "beforeblur":
          case "afterblur":
            k2 = Fd;
            break;
          case "click":
            if (2 === c.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            k2 = Bd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            k2 = Dd;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            k2 = Vd;
            break;
          case $e:
          case af:
          case bf:
            k2 = Hd;
            break;
          case cf:
            k2 = Xd;
            break;
          case "scroll":
            k2 = vd;
            break;
          case "wheel":
            k2 = Zd;
            break;
          case "copy":
          case "cut":
          case "paste":
            k2 = Jd;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            k2 = Td;
        }
        var t2 = 0 !== (b & 4), J2 = !t2 && "scroll" === a2, x2 = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
        t2 = [];
        for (var w2 = d3, u2; null !== w2; ) {
          u2 = w2;
          var F2 = u2.stateNode;
          5 === u2.tag && null !== F2 && (u2 = F2, null !== x2 && (F2 = Kb(w2, x2), null != F2 && t2.push(tf(w2, F2, u2))));
          if (J2) break;
          w2 = w2.return;
        }
        0 < t2.length && (h2 = new k2(h2, n2, null, c, e2), g3.push({ event: h2, listeners: t2 }));
      }
    }
    if (0 === (b & 7)) {
      a: {
        h2 = "mouseover" === a2 || "pointerover" === a2;
        k2 = "mouseout" === a2 || "pointerout" === a2;
        if (h2 && c !== wb && (n2 = c.relatedTarget || c.fromElement) && (Wc(n2) || n2[uf])) break a;
        if (k2 || h2) {
          h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
          if (k2) {
            if (n2 = c.relatedTarget || c.toElement, k2 = d3, n2 = n2 ? Wc(n2) : null, null !== n2 && (J2 = Vb(n2), n2 !== J2 || 5 !== n2.tag && 6 !== n2.tag)) n2 = null;
          } else k2 = null, n2 = d3;
          if (k2 !== n2) {
            t2 = Bd;
            F2 = "onMouseLeave";
            x2 = "onMouseEnter";
            w2 = "mouse";
            if ("pointerout" === a2 || "pointerover" === a2) t2 = Td, F2 = "onPointerLeave", x2 = "onPointerEnter", w2 = "pointer";
            J2 = null == k2 ? h2 : ue(k2);
            u2 = null == n2 ? h2 : ue(n2);
            h2 = new t2(F2, w2 + "leave", k2, c, e2);
            h2.target = J2;
            h2.relatedTarget = u2;
            F2 = null;
            Wc(e2) === d3 && (t2 = new t2(x2, w2 + "enter", n2, c, e2), t2.target = u2, t2.relatedTarget = J2, F2 = t2);
            J2 = F2;
            if (k2 && n2) b: {
              t2 = k2;
              x2 = n2;
              w2 = 0;
              for (u2 = t2; u2; u2 = vf(u2)) w2++;
              u2 = 0;
              for (F2 = x2; F2; F2 = vf(F2)) u2++;
              for (; 0 < w2 - u2; ) t2 = vf(t2), w2--;
              for (; 0 < u2 - w2; ) x2 = vf(x2), u2--;
              for (; w2--; ) {
                if (t2 === x2 || null !== x2 && t2 === x2.alternate) break b;
                t2 = vf(t2);
                x2 = vf(x2);
              }
              t2 = null;
            }
            else t2 = null;
            null !== k2 && wf(g3, h2, k2, t2, false);
            null !== n2 && null !== J2 && wf(g3, J2, n2, t2, true);
          }
        }
      }
      a: {
        h2 = d3 ? ue(d3) : window;
        k2 = h2.nodeName && h2.nodeName.toLowerCase();
        if ("select" === k2 || "input" === k2 && "file" === h2.type) var na = ve;
        else if (me(h2)) if (we) na = Fe;
        else {
          na = De;
          var xa = Ce;
        }
        else (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
        if (na && (na = na(a2, d3))) {
          ne(g3, na, c, e2);
          break a;
        }
        xa && xa(a2, h2, d3);
        "focusout" === a2 && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
      }
      xa = d3 ? ue(d3) : window;
      switch (a2) {
        case "focusin":
          if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d3, Se = null;
          break;
        case "focusout":
          Se = Re = Qe = null;
          break;
        case "mousedown":
          Te = true;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Te = false;
          Ue(g3, c, e2);
          break;
        case "selectionchange":
          if (Pe) break;
        case "keydown":
        case "keyup":
          Ue(g3, c, e2);
      }
      var $a;
      if (ae) b: {
        switch (a2) {
          case "compositionstart":
            var ba = "onCompositionStart";
            break b;
          case "compositionend":
            ba = "onCompositionEnd";
            break b;
          case "compositionupdate":
            ba = "onCompositionUpdate";
            break b;
        }
        ba = void 0;
      }
      else ie ? ge(a2, c) && (ba = "onCompositionEnd") : "keydown" === a2 && 229 === c.keyCode && (ba = "onCompositionStart");
      ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d3, ba), 0 < xa.length && (ba = new Ld(ba, a2, null, c, e2), g3.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
      if ($a = ce ? je(a2, c) : ke(a2, c)) d3 = oe(d3, "onBeforeInput"), 0 < d3.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g3.push({ event: e2, listeners: d3 }), e2.data = $a);
    }
    se(g3, b);
  });
}
function tf(a2, b, c) {
  return { instance: a2, listener: b, currentTarget: c };
}
function oe(a2, b) {
  for (var c = b + "Capture", d2 = []; null !== a2; ) {
    var e = a2, f2 = e.stateNode;
    5 === e.tag && null !== f2 && (e = f2, f2 = Kb(a2, c), null != f2 && d2.unshift(tf(a2, f2, e)), f2 = Kb(a2, b), null != f2 && d2.push(tf(a2, f2, e)));
    a2 = a2.return;
  }
  return d2;
}
function vf(a2) {
  if (null === a2) return null;
  do
    a2 = a2.return;
  while (a2 && 5 !== a2.tag);
  return a2 ? a2 : null;
}
function wf(a2, b, c, d2, e) {
  for (var f2 = b._reactName, g2 = []; null !== c && c !== d2; ) {
    var h = c, k = h.alternate, l2 = h.stateNode;
    if (null !== k && k === d2) break;
    5 === h.tag && null !== l2 && (h = l2, e ? (k = Kb(c, f2), null != k && g2.unshift(tf(c, k, h))) : e || (k = Kb(c, f2), null != k && g2.push(tf(c, k, h))));
    c = c.return;
  }
  0 !== g2.length && a2.push({ event: b, listeners: g2 });
}
var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
function zf(a2) {
  return ("string" === typeof a2 ? a2 : "" + a2).replace(xf, "\n").replace(yf, "");
}
function Af(a2, b, c) {
  b = zf(b);
  if (zf(a2) !== b && c) throw Error(p$3(425));
}
function Bf() {
}
var Cf = null, Df = null;
function Ef(a2, b) {
  return "textarea" === a2 || "noscript" === a2 || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
}
var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a2) {
  return Hf.resolve(null).then(a2).catch(If);
} : Ff;
function If(a2) {
  setTimeout(function() {
    throw a2;
  });
}
function Kf(a2, b) {
  var c = b, d2 = 0;
  do {
    var e = c.nextSibling;
    a2.removeChild(c);
    if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
      if (0 === d2) {
        a2.removeChild(e);
        bd(b);
        return;
      }
      d2--;
    } else "$" !== c && "$?" !== c && "$!" !== c || d2++;
    c = e;
  } while (c);
  bd(b);
}
function Lf(a2) {
  for (; null != a2; a2 = a2.nextSibling) {
    var b = a2.nodeType;
    if (1 === b || 3 === b) break;
    if (8 === b) {
      b = a2.data;
      if ("$" === b || "$!" === b || "$?" === b) break;
      if ("/$" === b) return null;
    }
  }
  return a2;
}
function Mf(a2) {
  a2 = a2.previousSibling;
  for (var b = 0; a2; ) {
    if (8 === a2.nodeType) {
      var c = a2.data;
      if ("$" === c || "$!" === c || "$?" === c) {
        if (0 === b) return a2;
        b--;
      } else "/$" === c && b++;
    }
    a2 = a2.previousSibling;
  }
  return null;
}
var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
function Wc(a2) {
  var b = a2[Of];
  if (b) return b;
  for (var c = a2.parentNode; c; ) {
    if (b = c[uf] || c[Of]) {
      c = b.alternate;
      if (null !== b.child || null !== c && null !== c.child) for (a2 = Mf(a2); null !== a2; ) {
        if (c = a2[Of]) return c;
        a2 = Mf(a2);
      }
      return b;
    }
    a2 = c;
    c = a2.parentNode;
  }
  return null;
}
function Cb(a2) {
  a2 = a2[Of] || a2[uf];
  return !a2 || 5 !== a2.tag && 6 !== a2.tag && 13 !== a2.tag && 3 !== a2.tag ? null : a2;
}
function ue(a2) {
  if (5 === a2.tag || 6 === a2.tag) return a2.stateNode;
  throw Error(p$3(33));
}
function Db(a2) {
  return a2[Pf] || null;
}
var Sf = [], Tf = -1;
function Uf(a2) {
  return { current: a2 };
}
function E(a2) {
  0 > Tf || (a2.current = Sf[Tf], Sf[Tf] = null, Tf--);
}
function G$1(a2, b) {
  Tf++;
  Sf[Tf] = a2.current;
  a2.current = b;
}
var Vf = {}, H = Uf(Vf), Wf = Uf(false), Xf = Vf;
function Yf(a2, b) {
  var c = a2.type.contextTypes;
  if (!c) return Vf;
  var d2 = a2.stateNode;
  if (d2 && d2.__reactInternalMemoizedUnmaskedChildContext === b) return d2.__reactInternalMemoizedMaskedChildContext;
  var e = {}, f2;
  for (f2 in c) e[f2] = b[f2];
  d2 && (a2 = a2.stateNode, a2.__reactInternalMemoizedUnmaskedChildContext = b, a2.__reactInternalMemoizedMaskedChildContext = e);
  return e;
}
function Zf(a2) {
  a2 = a2.childContextTypes;
  return null !== a2 && void 0 !== a2;
}
function $f() {
  E(Wf);
  E(H);
}
function ag(a2, b, c) {
  if (H.current !== Vf) throw Error(p$3(168));
  G$1(H, b);
  G$1(Wf, c);
}
function bg(a2, b, c) {
  var d2 = a2.stateNode;
  b = b.childContextTypes;
  if ("function" !== typeof d2.getChildContext) return c;
  d2 = d2.getChildContext();
  for (var e in d2) if (!(e in b)) throw Error(p$3(108, Ra(a2) || "Unknown", e));
  return A$1({}, c, d2);
}
function cg(a2) {
  a2 = (a2 = a2.stateNode) && a2.__reactInternalMemoizedMergedChildContext || Vf;
  Xf = H.current;
  G$1(H, a2);
  G$1(Wf, Wf.current);
  return true;
}
function dg(a2, b, c) {
  var d2 = a2.stateNode;
  if (!d2) throw Error(p$3(169));
  c ? (a2 = bg(a2, b, Xf), d2.__reactInternalMemoizedMergedChildContext = a2, E(Wf), E(H), G$1(H, a2)) : E(Wf);
  G$1(Wf, c);
}
var eg = null, fg = false, gg = false;
function hg(a2) {
  null === eg ? eg = [a2] : eg.push(a2);
}
function ig(a2) {
  fg = true;
  hg(a2);
}
function jg() {
  if (!gg && null !== eg) {
    gg = true;
    var a2 = 0, b = C;
    try {
      var c = eg;
      for (C = 1; a2 < c.length; a2++) {
        var d2 = c[a2];
        do
          d2 = d2(true);
        while (null !== d2);
      }
      eg = null;
      fg = false;
    } catch (e) {
      throw null !== eg && (eg = eg.slice(a2 + 1)), ac(fc, jg), e;
    } finally {
      C = b, gg = false;
    }
  }
  return null;
}
var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
function tg(a2, b) {
  kg[lg++] = ng;
  kg[lg++] = mg;
  mg = a2;
  ng = b;
}
function ug(a2, b, c) {
  og[pg++] = rg;
  og[pg++] = sg;
  og[pg++] = qg;
  qg = a2;
  var d2 = rg;
  a2 = sg;
  var e = 32 - oc(d2) - 1;
  d2 &= ~(1 << e);
  c += 1;
  var f2 = 32 - oc(b) + e;
  if (30 < f2) {
    var g2 = e - e % 5;
    f2 = (d2 & (1 << g2) - 1).toString(32);
    d2 >>= g2;
    e -= g2;
    rg = 1 << 32 - oc(b) + e | c << e | d2;
    sg = f2 + a2;
  } else rg = 1 << f2 | c << e | d2, sg = a2;
}
function vg(a2) {
  null !== a2.return && (tg(a2, 1), ug(a2, 1, 0));
}
function wg(a2) {
  for (; a2 === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
  for (; a2 === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
}
var xg = null, yg = null, I$2 = false, zg = null;
function Ag(a2, b) {
  var c = Bg(5, null, null, 0);
  c.elementType = "DELETED";
  c.stateNode = b;
  c.return = a2;
  b = a2.deletions;
  null === b ? (a2.deletions = [c], a2.flags |= 16) : b.push(c);
}
function Cg(a2, b) {
  switch (a2.tag) {
    case 5:
      var c = a2.type;
      b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
      return null !== b ? (a2.stateNode = b, xg = a2, yg = Lf(b.firstChild), true) : false;
    case 6:
      return b = "" === a2.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a2.stateNode = b, xg = a2, yg = null, true) : false;
    case 13:
      return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a2.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a2, a2.child = c, xg = a2, yg = null, true) : false;
    default:
      return false;
  }
}
function Dg(a2) {
  return 0 !== (a2.mode & 1) && 0 === (a2.flags & 128);
}
function Eg(a2) {
  if (I$2) {
    var b = yg;
    if (b) {
      var c = b;
      if (!Cg(a2, b)) {
        if (Dg(a2)) throw Error(p$3(418));
        b = Lf(c.nextSibling);
        var d2 = xg;
        b && Cg(a2, b) ? Ag(d2, c) : (a2.flags = a2.flags & -4097 | 2, I$2 = false, xg = a2);
      }
    } else {
      if (Dg(a2)) throw Error(p$3(418));
      a2.flags = a2.flags & -4097 | 2;
      I$2 = false;
      xg = a2;
    }
  }
}
function Fg(a2) {
  for (a2 = a2.return; null !== a2 && 5 !== a2.tag && 3 !== a2.tag && 13 !== a2.tag; ) a2 = a2.return;
  xg = a2;
}
function Gg(a2) {
  if (a2 !== xg) return false;
  if (!I$2) return Fg(a2), I$2 = true, false;
  var b;
  (b = 3 !== a2.tag) && !(b = 5 !== a2.tag) && (b = a2.type, b = "head" !== b && "body" !== b && !Ef(a2.type, a2.memoizedProps));
  if (b && (b = yg)) {
    if (Dg(a2)) throw Hg(), Error(p$3(418));
    for (; b; ) Ag(a2, b), b = Lf(b.nextSibling);
  }
  Fg(a2);
  if (13 === a2.tag) {
    a2 = a2.memoizedState;
    a2 = null !== a2 ? a2.dehydrated : null;
    if (!a2) throw Error(p$3(317));
    a: {
      a2 = a2.nextSibling;
      for (b = 0; a2; ) {
        if (8 === a2.nodeType) {
          var c = a2.data;
          if ("/$" === c) {
            if (0 === b) {
              yg = Lf(a2.nextSibling);
              break a;
            }
            b--;
          } else "$" !== c && "$!" !== c && "$?" !== c || b++;
        }
        a2 = a2.nextSibling;
      }
      yg = null;
    }
  } else yg = xg ? Lf(a2.stateNode.nextSibling) : null;
  return true;
}
function Hg() {
  for (var a2 = yg; a2; ) a2 = Lf(a2.nextSibling);
}
function Ig() {
  yg = xg = null;
  I$2 = false;
}
function Jg(a2) {
  null === zg ? zg = [a2] : zg.push(a2);
}
var Kg = ua$1.ReactCurrentBatchConfig;
function Lg(a2, b) {
  if (a2 && a2.defaultProps) {
    b = A$1({}, b);
    a2 = a2.defaultProps;
    for (var c in a2) void 0 === b[c] && (b[c] = a2[c]);
    return b;
  }
  return b;
}
var Mg = Uf(null), Ng = null, Og = null, Pg = null;
function Qg() {
  Pg = Og = Ng = null;
}
function Rg(a2) {
  var b = Mg.current;
  E(Mg);
  a2._currentValue = b;
}
function Sg(a2, b, c) {
  for (; null !== a2; ) {
    var d2 = a2.alternate;
    (a2.childLanes & b) !== b ? (a2.childLanes |= b, null !== d2 && (d2.childLanes |= b)) : null !== d2 && (d2.childLanes & b) !== b && (d2.childLanes |= b);
    if (a2 === c) break;
    a2 = a2.return;
  }
}
function Tg(a2, b) {
  Ng = a2;
  Pg = Og = null;
  a2 = a2.dependencies;
  null !== a2 && null !== a2.firstContext && (0 !== (a2.lanes & b) && (Ug = true), a2.firstContext = null);
}
function Vg(a2) {
  var b = a2._currentValue;
  if (Pg !== a2) if (a2 = { context: a2, memoizedValue: b, next: null }, null === Og) {
    if (null === Ng) throw Error(p$3(308));
    Og = a2;
    Ng.dependencies = { lanes: 0, firstContext: a2 };
  } else Og = Og.next = a2;
  return b;
}
var Wg = null;
function Xg(a2) {
  null === Wg ? Wg = [a2] : Wg.push(a2);
}
function Yg(a2, b, c, d2) {
  var e = b.interleaved;
  null === e ? (c.next = c, Xg(b)) : (c.next = e.next, e.next = c);
  b.interleaved = c;
  return Zg(a2, d2);
}
function Zg(a2, b) {
  a2.lanes |= b;
  var c = a2.alternate;
  null !== c && (c.lanes |= b);
  c = a2;
  for (a2 = a2.return; null !== a2; ) a2.childLanes |= b, c = a2.alternate, null !== c && (c.childLanes |= b), c = a2, a2 = a2.return;
  return 3 === c.tag ? c.stateNode : null;
}
var $g = false;
function ah(a2) {
  a2.updateQueue = { baseState: a2.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function bh(a2, b) {
  a2 = a2.updateQueue;
  b.updateQueue === a2 && (b.updateQueue = { baseState: a2.baseState, firstBaseUpdate: a2.firstBaseUpdate, lastBaseUpdate: a2.lastBaseUpdate, shared: a2.shared, effects: a2.effects });
}
function ch(a2, b) {
  return { eventTime: a2, lane: b, tag: 0, payload: null, callback: null, next: null };
}
function dh(a2, b, c) {
  var d2 = a2.updateQueue;
  if (null === d2) return null;
  d2 = d2.shared;
  if (0 !== (K & 2)) {
    var e = d2.pending;
    null === e ? b.next = b : (b.next = e.next, e.next = b);
    d2.pending = b;
    return Zg(a2, c);
  }
  e = d2.interleaved;
  null === e ? (b.next = b, Xg(d2)) : (b.next = e.next, e.next = b);
  d2.interleaved = b;
  return Zg(a2, c);
}
function eh(a2, b, c) {
  b = b.updateQueue;
  if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
    var d2 = b.lanes;
    d2 &= a2.pendingLanes;
    c |= d2;
    b.lanes = c;
    Cc(a2, c);
  }
}
function fh$1(a2, b) {
  var c = a2.updateQueue, d2 = a2.alternate;
  if (null !== d2 && (d2 = d2.updateQueue, c === d2)) {
    var e = null, f2 = null;
    c = c.firstBaseUpdate;
    if (null !== c) {
      do {
        var g2 = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
        null === f2 ? e = f2 = g2 : f2 = f2.next = g2;
        c = c.next;
      } while (null !== c);
      null === f2 ? e = f2 = b : f2 = f2.next = b;
    } else e = f2 = b;
    c = { baseState: d2.baseState, firstBaseUpdate: e, lastBaseUpdate: f2, shared: d2.shared, effects: d2.effects };
    a2.updateQueue = c;
    return;
  }
  a2 = c.lastBaseUpdate;
  null === a2 ? c.firstBaseUpdate = b : a2.next = b;
  c.lastBaseUpdate = b;
}
function gh(a2, b, c, d2) {
  var e = a2.updateQueue;
  $g = false;
  var f2 = e.firstBaseUpdate, g2 = e.lastBaseUpdate, h = e.shared.pending;
  if (null !== h) {
    e.shared.pending = null;
    var k = h, l2 = k.next;
    k.next = null;
    null === g2 ? f2 = l2 : g2.next = l2;
    g2 = k;
    var m2 = a2.alternate;
    null !== m2 && (m2 = m2.updateQueue, h = m2.lastBaseUpdate, h !== g2 && (null === h ? m2.firstBaseUpdate = l2 : h.next = l2, m2.lastBaseUpdate = k));
  }
  if (null !== f2) {
    var q2 = e.baseState;
    g2 = 0;
    m2 = l2 = k = null;
    h = f2;
    do {
      var r2 = h.lane, y2 = h.eventTime;
      if ((d2 & r2) === r2) {
        null !== m2 && (m2 = m2.next = {
          eventTime: y2,
          lane: 0,
          tag: h.tag,
          payload: h.payload,
          callback: h.callback,
          next: null
        });
        a: {
          var n2 = a2, t2 = h;
          r2 = b;
          y2 = c;
          switch (t2.tag) {
            case 1:
              n2 = t2.payload;
              if ("function" === typeof n2) {
                q2 = n2.call(y2, q2, r2);
                break a;
              }
              q2 = n2;
              break a;
            case 3:
              n2.flags = n2.flags & -65537 | 128;
            case 0:
              n2 = t2.payload;
              r2 = "function" === typeof n2 ? n2.call(y2, q2, r2) : n2;
              if (null === r2 || void 0 === r2) break a;
              q2 = A$1({}, q2, r2);
              break a;
            case 2:
              $g = true;
          }
        }
        null !== h.callback && 0 !== h.lane && (a2.flags |= 64, r2 = e.effects, null === r2 ? e.effects = [h] : r2.push(h));
      } else y2 = { eventTime: y2, lane: r2, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m2 ? (l2 = m2 = y2, k = q2) : m2 = m2.next = y2, g2 |= r2;
      h = h.next;
      if (null === h) if (h = e.shared.pending, null === h) break;
      else r2 = h, h = r2.next, r2.next = null, e.lastBaseUpdate = r2, e.shared.pending = null;
    } while (1);
    null === m2 && (k = q2);
    e.baseState = k;
    e.firstBaseUpdate = l2;
    e.lastBaseUpdate = m2;
    b = e.shared.interleaved;
    if (null !== b) {
      e = b;
      do
        g2 |= e.lane, e = e.next;
      while (e !== b);
    } else null === f2 && (e.shared.lanes = 0);
    hh |= g2;
    a2.lanes = g2;
    a2.memoizedState = q2;
  }
}
function ih(a2, b, c) {
  a2 = b.effects;
  b.effects = null;
  if (null !== a2) for (b = 0; b < a2.length; b++) {
    var d2 = a2[b], e = d2.callback;
    if (null !== e) {
      d2.callback = null;
      d2 = c;
      if ("function" !== typeof e) throw Error(p$3(191, e));
      e.call(d2);
    }
  }
}
var jh = new aa.Component().refs;
function kh(a2, b, c, d2) {
  b = a2.memoizedState;
  c = c(d2, b);
  c = null === c || void 0 === c ? b : A$1({}, b, c);
  a2.memoizedState = c;
  0 === a2.lanes && (a2.updateQueue.baseState = c);
}
var nh = { isMounted: function(a2) {
  return (a2 = a2._reactInternals) ? Vb(a2) === a2 : false;
}, enqueueSetState: function(a2, b, c) {
  a2 = a2._reactInternals;
  var d2 = L$1(), e = lh(a2), f2 = ch(d2, e);
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = dh(a2, f2, e);
  null !== b && (mh(b, a2, e, d2), eh(b, a2, e));
}, enqueueReplaceState: function(a2, b, c) {
  a2 = a2._reactInternals;
  var d2 = L$1(), e = lh(a2), f2 = ch(d2, e);
  f2.tag = 1;
  f2.payload = b;
  void 0 !== c && null !== c && (f2.callback = c);
  b = dh(a2, f2, e);
  null !== b && (mh(b, a2, e, d2), eh(b, a2, e));
}, enqueueForceUpdate: function(a2, b) {
  a2 = a2._reactInternals;
  var c = L$1(), d2 = lh(a2), e = ch(c, d2);
  e.tag = 2;
  void 0 !== b && null !== b && (e.callback = b);
  b = dh(a2, e, d2);
  null !== b && (mh(b, a2, d2, c), eh(b, a2, d2));
} };
function oh(a2, b, c, d2, e, f2, g2) {
  a2 = a2.stateNode;
  return "function" === typeof a2.shouldComponentUpdate ? a2.shouldComponentUpdate(d2, f2, g2) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d2) || !Ie(e, f2) : true;
}
function ph(a2, b, c) {
  var d2 = false, e = Vf;
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? f2 = Vg(f2) : (e = Zf(b) ? Xf : H.current, d2 = b.contextTypes, f2 = (d2 = null !== d2 && void 0 !== d2) ? Yf(a2, e) : Vf);
  b = new b(c, f2);
  a2.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
  b.updater = nh;
  a2.stateNode = b;
  b._reactInternals = a2;
  d2 && (a2 = a2.stateNode, a2.__reactInternalMemoizedUnmaskedChildContext = e, a2.__reactInternalMemoizedMaskedChildContext = f2);
  return b;
}
function qh(a2, b, c, d2) {
  a2 = b.state;
  "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d2);
  "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d2);
  b.state !== a2 && nh.enqueueReplaceState(b, b.state, null);
}
function rh(a2, b, c, d2) {
  var e = a2.stateNode;
  e.props = c;
  e.state = a2.memoizedState;
  e.refs = jh;
  ah(a2);
  var f2 = b.contextType;
  "object" === typeof f2 && null !== f2 ? e.context = Vg(f2) : (f2 = Zf(b) ? Xf : H.current, e.context = Yf(a2, f2));
  e.state = a2.memoizedState;
  f2 = b.getDerivedStateFromProps;
  "function" === typeof f2 && (kh(a2, b, f2, c), e.state = a2.memoizedState);
  "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && nh.enqueueReplaceState(e, e.state, null), gh(a2, c, e, d2), e.state = a2.memoizedState);
  "function" === typeof e.componentDidMount && (a2.flags |= 4194308);
}
function sh(a2, b, c) {
  a2 = c.ref;
  if (null !== a2 && "function" !== typeof a2 && "object" !== typeof a2) {
    if (c._owner) {
      c = c._owner;
      if (c) {
        if (1 !== c.tag) throw Error(p$3(309));
        var d2 = c.stateNode;
      }
      if (!d2) throw Error(p$3(147, a2));
      var e = d2, f2 = "" + a2;
      if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f2) return b.ref;
      b = function(a3) {
        var b2 = e.refs;
        b2 === jh && (b2 = e.refs = {});
        null === a3 ? delete b2[f2] : b2[f2] = a3;
      };
      b._stringRef = f2;
      return b;
    }
    if ("string" !== typeof a2) throw Error(p$3(284));
    if (!c._owner) throw Error(p$3(290, a2));
  }
  return a2;
}
function th(a2, b) {
  a2 = Object.prototype.toString.call(b);
  throw Error(p$3(31, "[object Object]" === a2 ? "object with keys {" + Object.keys(b).join(", ") + "}" : a2));
}
function uh(a2) {
  var b = a2._init;
  return b(a2._payload);
}
function vh(a2) {
  function b(b2, c2) {
    if (a2) {
      var d3 = b2.deletions;
      null === d3 ? (b2.deletions = [c2], b2.flags |= 16) : d3.push(c2);
    }
  }
  function c(c2, d3) {
    if (!a2) return null;
    for (; null !== d3; ) b(c2, d3), d3 = d3.sibling;
    return null;
  }
  function d2(a3, b2) {
    for (a3 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a3.set(b2.key, b2) : a3.set(b2.index, b2), b2 = b2.sibling;
    return a3;
  }
  function e(a3, b2) {
    a3 = wh(a3, b2);
    a3.index = 0;
    a3.sibling = null;
    return a3;
  }
  function f2(b2, c2, d3) {
    b2.index = d3;
    if (!a2) return b2.flags |= 1048576, c2;
    d3 = b2.alternate;
    if (null !== d3) return d3 = d3.index, d3 < c2 ? (b2.flags |= 2, c2) : d3;
    b2.flags |= 2;
    return c2;
  }
  function g2(b2) {
    a2 && null === b2.alternate && (b2.flags |= 2);
    return b2;
  }
  function h(a3, b2, c2, d3) {
    if (null === b2 || 6 !== b2.tag) return b2 = xh(c2, a3.mode, d3), b2.return = a3, b2;
    b2 = e(b2, c2);
    b2.return = a3;
    return b2;
  }
  function k(a3, b2, c2, d3) {
    var f3 = c2.type;
    if (f3 === ya) return m2(a3, b2, c2.props.children, d3, c2.key);
    if (null !== b2 && (b2.elementType === f3 || "object" === typeof f3 && null !== f3 && f3.$$typeof === Ha && uh(f3) === b2.type)) return d3 = e(b2, c2.props), d3.ref = sh(a3, b2, c2), d3.return = a3, d3;
    d3 = yh(c2.type, c2.key, c2.props, null, a3.mode, d3);
    d3.ref = sh(a3, b2, c2);
    d3.return = a3;
    return d3;
  }
  function l2(a3, b2, c2, d3) {
    if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = zh(c2, a3.mode, d3), b2.return = a3, b2;
    b2 = e(b2, c2.children || []);
    b2.return = a3;
    return b2;
  }
  function m2(a3, b2, c2, d3, f3) {
    if (null === b2 || 7 !== b2.tag) return b2 = Ah(c2, a3.mode, d3, f3), b2.return = a3, b2;
    b2 = e(b2, c2);
    b2.return = a3;
    return b2;
  }
  function q2(a3, b2, c2) {
    if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = xh("" + b2, a3.mode, c2), b2.return = a3, b2;
    if ("object" === typeof b2 && null !== b2) {
      switch (b2.$$typeof) {
        case va:
          return c2 = yh(b2.type, b2.key, b2.props, null, a3.mode, c2), c2.ref = sh(a3, null, b2), c2.return = a3, c2;
        case wa$1:
          return b2 = zh(b2, a3.mode, c2), b2.return = a3, b2;
        case Ha:
          var d3 = b2._init;
          return q2(a3, d3(b2._payload), c2);
      }
      if (eb(b2) || Ka(b2)) return b2 = Ah(b2, a3.mode, c2, null), b2.return = a3, b2;
      th(a3, b2);
    }
    return null;
  }
  function r2(a3, b2, c2, d3) {
    var e2 = null !== b2 ? b2.key : null;
    if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a3, b2, "" + c2, d3);
    if ("object" === typeof c2 && null !== c2) {
      switch (c2.$$typeof) {
        case va:
          return c2.key === e2 ? k(a3, b2, c2, d3) : null;
        case wa$1:
          return c2.key === e2 ? l2(a3, b2, c2, d3) : null;
        case Ha:
          return e2 = c2._init, r2(
            a3,
            b2,
            e2(c2._payload),
            d3
          );
      }
      if (eb(c2) || Ka(c2)) return null !== e2 ? null : m2(a3, b2, c2, d3, null);
      th(a3, c2);
    }
    return null;
  }
  function y2(a3, b2, c2, d3, e2) {
    if ("string" === typeof d3 && "" !== d3 || "number" === typeof d3) return a3 = a3.get(c2) || null, h(b2, a3, "" + d3, e2);
    if ("object" === typeof d3 && null !== d3) {
      switch (d3.$$typeof) {
        case va:
          return a3 = a3.get(null === d3.key ? c2 : d3.key) || null, k(b2, a3, d3, e2);
        case wa$1:
          return a3 = a3.get(null === d3.key ? c2 : d3.key) || null, l2(b2, a3, d3, e2);
        case Ha:
          var f3 = d3._init;
          return y2(a3, b2, c2, f3(d3._payload), e2);
      }
      if (eb(d3) || Ka(d3)) return a3 = a3.get(c2) || null, m2(b2, a3, d3, e2, null);
      th(b2, d3);
    }
    return null;
  }
  function n2(e2, g3, h2, k2) {
    for (var l3 = null, m3 = null, u2 = g3, w2 = g3 = 0, x2 = null; null !== u2 && w2 < h2.length; w2++) {
      u2.index > w2 ? (x2 = u2, u2 = null) : x2 = u2.sibling;
      var n3 = r2(e2, u2, h2[w2], k2);
      if (null === n3) {
        null === u2 && (u2 = x2);
        break;
      }
      a2 && u2 && null === n3.alternate && b(e2, u2);
      g3 = f2(n3, g3, w2);
      null === m3 ? l3 = n3 : m3.sibling = n3;
      m3 = n3;
      u2 = x2;
    }
    if (w2 === h2.length) return c(e2, u2), I$2 && tg(e2, w2), l3;
    if (null === u2) {
      for (; w2 < h2.length; w2++) u2 = q2(e2, h2[w2], k2), null !== u2 && (g3 = f2(u2, g3, w2), null === m3 ? l3 = u2 : m3.sibling = u2, m3 = u2);
      I$2 && tg(e2, w2);
      return l3;
    }
    for (u2 = d2(e2, u2); w2 < h2.length; w2++) x2 = y2(u2, e2, w2, h2[w2], k2), null !== x2 && (a2 && null !== x2.alternate && u2.delete(null === x2.key ? w2 : x2.key), g3 = f2(x2, g3, w2), null === m3 ? l3 = x2 : m3.sibling = x2, m3 = x2);
    a2 && u2.forEach(function(a3) {
      return b(e2, a3);
    });
    I$2 && tg(e2, w2);
    return l3;
  }
  function t2(e2, g3, h2, k2) {
    var l3 = Ka(h2);
    if ("function" !== typeof l3) throw Error(p$3(150));
    h2 = l3.call(h2);
    if (null == h2) throw Error(p$3(151));
    for (var u2 = l3 = null, m3 = g3, w2 = g3 = 0, x2 = null, n3 = h2.next(); null !== m3 && !n3.done; w2++, n3 = h2.next()) {
      m3.index > w2 ? (x2 = m3, m3 = null) : x2 = m3.sibling;
      var t3 = r2(e2, m3, n3.value, k2);
      if (null === t3) {
        null === m3 && (m3 = x2);
        break;
      }
      a2 && m3 && null === t3.alternate && b(e2, m3);
      g3 = f2(t3, g3, w2);
      null === u2 ? l3 = t3 : u2.sibling = t3;
      u2 = t3;
      m3 = x2;
    }
    if (n3.done) return c(
      e2,
      m3
    ), I$2 && tg(e2, w2), l3;
    if (null === m3) {
      for (; !n3.done; w2++, n3 = h2.next()) n3 = q2(e2, n3.value, k2), null !== n3 && (g3 = f2(n3, g3, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
      I$2 && tg(e2, w2);
      return l3;
    }
    for (m3 = d2(e2, m3); !n3.done; w2++, n3 = h2.next()) n3 = y2(m3, e2, w2, n3.value, k2), null !== n3 && (a2 && null !== n3.alternate && m3.delete(null === n3.key ? w2 : n3.key), g3 = f2(n3, g3, w2), null === u2 ? l3 = n3 : u2.sibling = n3, u2 = n3);
    a2 && m3.forEach(function(a3) {
      return b(e2, a3);
    });
    I$2 && tg(e2, w2);
    return l3;
  }
  function J2(a3, d3, f3, h2) {
    "object" === typeof f3 && null !== f3 && f3.type === ya && null === f3.key && (f3 = f3.props.children);
    if ("object" === typeof f3 && null !== f3) {
      switch (f3.$$typeof) {
        case va:
          a: {
            for (var k2 = f3.key, l3 = d3; null !== l3; ) {
              if (l3.key === k2) {
                k2 = f3.type;
                if (k2 === ya) {
                  if (7 === l3.tag) {
                    c(a3, l3.sibling);
                    d3 = e(l3, f3.props.children);
                    d3.return = a3;
                    a3 = d3;
                    break a;
                  }
                } else if (l3.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && uh(k2) === l3.type) {
                  c(a3, l3.sibling);
                  d3 = e(l3, f3.props);
                  d3.ref = sh(a3, l3, f3);
                  d3.return = a3;
                  a3 = d3;
                  break a;
                }
                c(a3, l3);
                break;
              } else b(a3, l3);
              l3 = l3.sibling;
            }
            f3.type === ya ? (d3 = Ah(f3.props.children, a3.mode, h2, f3.key), d3.return = a3, a3 = d3) : (h2 = yh(f3.type, f3.key, f3.props, null, a3.mode, h2), h2.ref = sh(a3, d3, f3), h2.return = a3, a3 = h2);
          }
          return g2(a3);
        case wa$1:
          a: {
            for (l3 = f3.key; null !== d3; ) {
              if (d3.key === l3) if (4 === d3.tag && d3.stateNode.containerInfo === f3.containerInfo && d3.stateNode.implementation === f3.implementation) {
                c(a3, d3.sibling);
                d3 = e(d3, f3.children || []);
                d3.return = a3;
                a3 = d3;
                break a;
              } else {
                c(a3, d3);
                break;
              }
              else b(a3, d3);
              d3 = d3.sibling;
            }
            d3 = zh(f3, a3.mode, h2);
            d3.return = a3;
            a3 = d3;
          }
          return g2(a3);
        case Ha:
          return l3 = f3._init, J2(a3, d3, l3(f3._payload), h2);
      }
      if (eb(f3)) return n2(a3, d3, f3, h2);
      if (Ka(f3)) return t2(a3, d3, f3, h2);
      th(a3, f3);
    }
    return "string" === typeof f3 && "" !== f3 || "number" === typeof f3 ? (f3 = "" + f3, null !== d3 && 6 === d3.tag ? (c(a3, d3.sibling), d3 = e(d3, f3), d3.return = a3, a3 = d3) : (c(a3, d3), d3 = xh(f3, a3.mode, h2), d3.return = a3, a3 = d3), g2(a3)) : c(a3, d3);
  }
  return J2;
}
var Bh = vh(true), Ch = vh(false), Dh = {}, Eh = Uf(Dh), Fh = Uf(Dh), Gh = Uf(Dh);
function Hh(a2) {
  if (a2 === Dh) throw Error(p$3(174));
  return a2;
}
function Ih(a2, b) {
  G$1(Gh, b);
  G$1(Fh, a2);
  G$1(Eh, Dh);
  a2 = b.nodeType;
  switch (a2) {
    case 9:
    case 11:
      b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
      break;
    default:
      a2 = 8 === a2 ? b.parentNode : b, b = a2.namespaceURI || null, a2 = a2.tagName, b = lb(b, a2);
  }
  E(Eh);
  G$1(Eh, b);
}
function Jh() {
  E(Eh);
  E(Fh);
  E(Gh);
}
function Kh(a2) {
  Hh(Gh.current);
  var b = Hh(Eh.current);
  var c = lb(b, a2.type);
  b !== c && (G$1(Fh, a2), G$1(Eh, c));
}
function Lh(a2) {
  Fh.current === a2 && (E(Eh), E(Fh));
}
var M = Uf(0);
function Mh(a2) {
  for (var b = a2; null !== b; ) {
    if (13 === b.tag) {
      var c = b.memoizedState;
      if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
    } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
      if (0 !== (b.flags & 128)) return b;
    } else if (null !== b.child) {
      b.child.return = b;
      b = b.child;
      continue;
    }
    if (b === a2) break;
    for (; null === b.sibling; ) {
      if (null === b.return || b.return === a2) return null;
      b = b.return;
    }
    b.sibling.return = b.return;
    b = b.sibling;
  }
  return null;
}
var Nh = [];
function Oh() {
  for (var a2 = 0; a2 < Nh.length; a2++) Nh[a2]._workInProgressVersionPrimary = null;
  Nh.length = 0;
}
var Ph = ua$1.ReactCurrentDispatcher, Qh = ua$1.ReactCurrentBatchConfig, Rh = 0, N = null, O = null, P$1 = null, Sh = false, Th = false, Uh = 0, Vh = 0;
function Q() {
  throw Error(p$3(321));
}
function Wh(a2, b) {
  if (null === b) return false;
  for (var c = 0; c < b.length && c < a2.length; c++) if (!He(a2[c], b[c])) return false;
  return true;
}
function Xh(a2, b, c, d2, e, f2) {
  Rh = f2;
  N = b;
  b.memoizedState = null;
  b.updateQueue = null;
  b.lanes = 0;
  Ph.current = null === a2 || null === a2.memoizedState ? Yh : Zh;
  a2 = c(d2, e);
  if (Th) {
    f2 = 0;
    do {
      Th = false;
      Uh = 0;
      if (25 <= f2) throw Error(p$3(301));
      f2 += 1;
      P$1 = O = null;
      b.updateQueue = null;
      Ph.current = $h;
      a2 = c(d2, e);
    } while (Th);
  }
  Ph.current = ai;
  b = null !== O && null !== O.next;
  Rh = 0;
  P$1 = O = N = null;
  Sh = false;
  if (b) throw Error(p$3(300));
  return a2;
}
function bi() {
  var a2 = 0 !== Uh;
  Uh = 0;
  return a2;
}
function ci() {
  var a2 = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  null === P$1 ? N.memoizedState = P$1 = a2 : P$1 = P$1.next = a2;
  return P$1;
}
function di() {
  if (null === O) {
    var a2 = N.alternate;
    a2 = null !== a2 ? a2.memoizedState : null;
  } else a2 = O.next;
  var b = null === P$1 ? N.memoizedState : P$1.next;
  if (null !== b) P$1 = b, O = a2;
  else {
    if (null === a2) throw Error(p$3(310));
    O = a2;
    a2 = { memoizedState: O.memoizedState, baseState: O.baseState, baseQueue: O.baseQueue, queue: O.queue, next: null };
    null === P$1 ? N.memoizedState = P$1 = a2 : P$1 = P$1.next = a2;
  }
  return P$1;
}
function ei(a2, b) {
  return "function" === typeof b ? b(a2) : b;
}
function fi(a2) {
  var b = di(), c = b.queue;
  if (null === c) throw Error(p$3(311));
  c.lastRenderedReducer = a2;
  var d2 = O, e = d2.baseQueue, f2 = c.pending;
  if (null !== f2) {
    if (null !== e) {
      var g2 = e.next;
      e.next = f2.next;
      f2.next = g2;
    }
    d2.baseQueue = e = f2;
    c.pending = null;
  }
  if (null !== e) {
    f2 = e.next;
    d2 = d2.baseState;
    var h = g2 = null, k = null, l2 = f2;
    do {
      var m2 = l2.lane;
      if ((Rh & m2) === m2) null !== k && (k = k.next = { lane: 0, action: l2.action, hasEagerState: l2.hasEagerState, eagerState: l2.eagerState, next: null }), d2 = l2.hasEagerState ? l2.eagerState : a2(d2, l2.action);
      else {
        var q2 = {
          lane: m2,
          action: l2.action,
          hasEagerState: l2.hasEagerState,
          eagerState: l2.eagerState,
          next: null
        };
        null === k ? (h = k = q2, g2 = d2) : k = k.next = q2;
        N.lanes |= m2;
        hh |= m2;
      }
      l2 = l2.next;
    } while (null !== l2 && l2 !== f2);
    null === k ? g2 = d2 : k.next = h;
    He(d2, b.memoizedState) || (Ug = true);
    b.memoizedState = d2;
    b.baseState = g2;
    b.baseQueue = k;
    c.lastRenderedState = d2;
  }
  a2 = c.interleaved;
  if (null !== a2) {
    e = a2;
    do
      f2 = e.lane, N.lanes |= f2, hh |= f2, e = e.next;
    while (e !== a2);
  } else null === e && (c.lanes = 0);
  return [b.memoizedState, c.dispatch];
}
function gi(a2) {
  var b = di(), c = b.queue;
  if (null === c) throw Error(p$3(311));
  c.lastRenderedReducer = a2;
  var d2 = c.dispatch, e = c.pending, f2 = b.memoizedState;
  if (null !== e) {
    c.pending = null;
    var g2 = e = e.next;
    do
      f2 = a2(f2, g2.action), g2 = g2.next;
    while (g2 !== e);
    He(f2, b.memoizedState) || (Ug = true);
    b.memoizedState = f2;
    null === b.baseQueue && (b.baseState = f2);
    c.lastRenderedState = f2;
  }
  return [f2, d2];
}
function hi() {
}
function ii(a2, b) {
  var c = N, d2 = di(), e = b(), f2 = !He(d2.memoizedState, e);
  f2 && (d2.memoizedState = e, Ug = true);
  d2 = d2.queue;
  ji(ki.bind(null, c, d2, a2), [a2]);
  if (d2.getSnapshot !== b || f2 || null !== P$1 && P$1.memoizedState.tag & 1) {
    c.flags |= 2048;
    li(9, mi.bind(null, c, d2, e, b), void 0, null);
    if (null === R) throw Error(p$3(349));
    0 !== (Rh & 30) || ni(c, b, e);
  }
  return e;
}
function ni(a2, b, c) {
  a2.flags |= 16384;
  a2 = { getSnapshot: b, value: c };
  b = N.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, N.updateQueue = b, b.stores = [a2]) : (c = b.stores, null === c ? b.stores = [a2] : c.push(a2));
}
function mi(a2, b, c, d2) {
  b.value = c;
  b.getSnapshot = d2;
  oi(b) && pi(a2);
}
function ki(a2, b, c) {
  return c(function() {
    oi(b) && pi(a2);
  });
}
function oi(a2) {
  var b = a2.getSnapshot;
  a2 = a2.value;
  try {
    var c = b();
    return !He(a2, c);
  } catch (d2) {
    return true;
  }
}
function pi(a2) {
  var b = Zg(a2, 1);
  null !== b && mh(b, a2, 1, -1);
}
function qi(a2) {
  var b = ci();
  "function" === typeof a2 && (a2 = a2());
  b.memoizedState = b.baseState = a2;
  a2 = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: ei, lastRenderedState: a2 };
  b.queue = a2;
  a2 = a2.dispatch = ri.bind(null, N, a2);
  return [b.memoizedState, a2];
}
function li(a2, b, c, d2) {
  a2 = { tag: a2, create: b, destroy: c, deps: d2, next: null };
  b = N.updateQueue;
  null === b ? (b = { lastEffect: null, stores: null }, N.updateQueue = b, b.lastEffect = a2.next = a2) : (c = b.lastEffect, null === c ? b.lastEffect = a2.next = a2 : (d2 = c.next, c.next = a2, a2.next = d2, b.lastEffect = a2));
  return a2;
}
function si() {
  return di().memoizedState;
}
function ti(a2, b, c, d2) {
  var e = ci();
  N.flags |= a2;
  e.memoizedState = li(1 | b, c, void 0, void 0 === d2 ? null : d2);
}
function ui(a2, b, c, d2) {
  var e = di();
  d2 = void 0 === d2 ? null : d2;
  var f2 = void 0;
  if (null !== O) {
    var g2 = O.memoizedState;
    f2 = g2.destroy;
    if (null !== d2 && Wh(d2, g2.deps)) {
      e.memoizedState = li(b, c, f2, d2);
      return;
    }
  }
  N.flags |= a2;
  e.memoizedState = li(1 | b, c, f2, d2);
}
function vi(a2, b) {
  return ti(8390656, 8, a2, b);
}
function ji(a2, b) {
  return ui(2048, 8, a2, b);
}
function wi(a2, b) {
  return ui(4, 2, a2, b);
}
function xi(a2, b) {
  return ui(4, 4, a2, b);
}
function yi(a2, b) {
  if ("function" === typeof b) return a2 = a2(), b(a2), function() {
    b(null);
  };
  if (null !== b && void 0 !== b) return a2 = a2(), b.current = a2, function() {
    b.current = null;
  };
}
function zi(a2, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a2]) : null;
  return ui(4, 4, yi.bind(null, b, a2), c);
}
function Ai() {
}
function Bi(a2, b) {
  var c = di();
  b = void 0 === b ? null : b;
  var d2 = c.memoizedState;
  if (null !== d2 && null !== b && Wh(b, d2[1])) return d2[0];
  c.memoizedState = [a2, b];
  return a2;
}
function Ci(a2, b) {
  var c = di();
  b = void 0 === b ? null : b;
  var d2 = c.memoizedState;
  if (null !== d2 && null !== b && Wh(b, d2[1])) return d2[0];
  a2 = a2();
  c.memoizedState = [a2, b];
  return a2;
}
function Di(a2, b, c) {
  if (0 === (Rh & 21)) return a2.baseState && (a2.baseState = false, Ug = true), a2.memoizedState = c;
  He(c, b) || (c = yc(), N.lanes |= c, hh |= c, a2.baseState = true);
  return b;
}
function Ei(a2, b) {
  var c = C;
  C = 0 !== c && 4 > c ? c : 4;
  a2(true);
  var d2 = Qh.transition;
  Qh.transition = {};
  try {
    a2(false), b();
  } finally {
    C = c, Qh.transition = d2;
  }
}
function Fi() {
  return di().memoizedState;
}
function Gi(a2, b, c) {
  var d2 = lh(a2);
  c = { lane: d2, action: c, hasEagerState: false, eagerState: null, next: null };
  if (Hi(a2)) Ii(b, c);
  else if (c = Yg(a2, b, c, d2), null !== c) {
    var e = L$1();
    mh(c, a2, d2, e);
    Ji(c, b, d2);
  }
}
function ri(a2, b, c) {
  var d2 = lh(a2), e = { lane: d2, action: c, hasEagerState: false, eagerState: null, next: null };
  if (Hi(a2)) Ii(b, e);
  else {
    var f2 = a2.alternate;
    if (0 === a2.lanes && (null === f2 || 0 === f2.lanes) && (f2 = b.lastRenderedReducer, null !== f2)) try {
      var g2 = b.lastRenderedState, h = f2(g2, c);
      e.hasEagerState = true;
      e.eagerState = h;
      if (He(h, g2)) {
        var k = b.interleaved;
        null === k ? (e.next = e, Xg(b)) : (e.next = k.next, k.next = e);
        b.interleaved = e;
        return;
      }
    } catch (l2) {
    } finally {
    }
    c = Yg(a2, b, e, d2);
    null !== c && (e = L$1(), mh(c, a2, d2, e), Ji(c, b, d2));
  }
}
function Hi(a2) {
  var b = a2.alternate;
  return a2 === N || null !== b && b === N;
}
function Ii(a2, b) {
  Th = Sh = true;
  var c = a2.pending;
  null === c ? b.next = b : (b.next = c.next, c.next = b);
  a2.pending = b;
}
function Ji(a2, b, c) {
  if (0 !== (c & 4194240)) {
    var d2 = b.lanes;
    d2 &= a2.pendingLanes;
    c |= d2;
    b.lanes = c;
    Cc(a2, c);
  }
}
var ai = { readContext: Vg, useCallback: Q, useContext: Q, useEffect: Q, useImperativeHandle: Q, useInsertionEffect: Q, useLayoutEffect: Q, useMemo: Q, useReducer: Q, useRef: Q, useState: Q, useDebugValue: Q, useDeferredValue: Q, useTransition: Q, useMutableSource: Q, useSyncExternalStore: Q, useId: Q, unstable_isNewReconciler: false }, Yh = { readContext: Vg, useCallback: function(a2, b) {
  ci().memoizedState = [a2, void 0 === b ? null : b];
  return a2;
}, useContext: Vg, useEffect: vi, useImperativeHandle: function(a2, b, c) {
  c = null !== c && void 0 !== c ? c.concat([a2]) : null;
  return ti(
    4194308,
    4,
    yi.bind(null, b, a2),
    c
  );
}, useLayoutEffect: function(a2, b) {
  return ti(4194308, 4, a2, b);
}, useInsertionEffect: function(a2, b) {
  return ti(4, 2, a2, b);
}, useMemo: function(a2, b) {
  var c = ci();
  b = void 0 === b ? null : b;
  a2 = a2();
  c.memoizedState = [a2, b];
  return a2;
}, useReducer: function(a2, b, c) {
  var d2 = ci();
  b = void 0 !== c ? c(b) : b;
  d2.memoizedState = d2.baseState = b;
  a2 = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a2, lastRenderedState: b };
  d2.queue = a2;
  a2 = a2.dispatch = Gi.bind(null, N, a2);
  return [d2.memoizedState, a2];
}, useRef: function(a2) {
  var b = ci();
  a2 = { current: a2 };
  return b.memoizedState = a2;
}, useState: qi, useDebugValue: Ai, useDeferredValue: function(a2) {
  return ci().memoizedState = a2;
}, useTransition: function() {
  var a2 = qi(false), b = a2[0];
  a2 = Ei.bind(null, a2[1]);
  ci().memoizedState = a2;
  return [b, a2];
}, useMutableSource: function() {
}, useSyncExternalStore: function(a2, b, c) {
  var d2 = N, e = ci();
  if (I$2) {
    if (void 0 === c) throw Error(p$3(407));
    c = c();
  } else {
    c = b();
    if (null === R) throw Error(p$3(349));
    0 !== (Rh & 30) || ni(d2, b, c);
  }
  e.memoizedState = c;
  var f2 = { value: c, getSnapshot: b };
  e.queue = f2;
  vi(ki.bind(
    null,
    d2,
    f2,
    a2
  ), [a2]);
  d2.flags |= 2048;
  li(9, mi.bind(null, d2, f2, c, b), void 0, null);
  return c;
}, useId: function() {
  var a2 = ci(), b = R.identifierPrefix;
  if (I$2) {
    var c = sg;
    var d2 = rg;
    c = (d2 & ~(1 << 32 - oc(d2) - 1)).toString(32) + c;
    b = ":" + b + "R" + c;
    c = Uh++;
    0 < c && (b += "H" + c.toString(32));
    b += ":";
  } else c = Vh++, b = ":" + b + "r" + c.toString(32) + ":";
  return a2.memoizedState = b;
}, unstable_isNewReconciler: false }, Zh = {
  readContext: Vg,
  useCallback: Bi,
  useContext: Vg,
  useEffect: ji,
  useImperativeHandle: zi,
  useInsertionEffect: wi,
  useLayoutEffect: xi,
  useMemo: Ci,
  useReducer: fi,
  useRef: si,
  useState: function() {
    return fi(ei);
  },
  useDebugValue: Ai,
  useDeferredValue: function(a2) {
    var b = di();
    return Di(b, O.memoizedState, a2);
  },
  useTransition: function() {
    var a2 = fi(ei)[0], b = di().memoizedState;
    return [a2, b];
  },
  useMutableSource: hi,
  useSyncExternalStore: ii,
  useId: Fi,
  unstable_isNewReconciler: false
}, $h = { readContext: Vg, useCallback: Bi, useContext: Vg, useEffect: ji, useImperativeHandle: zi, useInsertionEffect: wi, useLayoutEffect: xi, useMemo: Ci, useReducer: gi, useRef: si, useState: function() {
  return gi(ei);
}, useDebugValue: Ai, useDeferredValue: function(a2) {
  var b = di();
  return null === O ? b.memoizedState = a2 : Di(b, O.memoizedState, a2);
}, useTransition: function() {
  var a2 = gi(ei)[0], b = di().memoizedState;
  return [a2, b];
}, useMutableSource: hi, useSyncExternalStore: ii, useId: Fi, unstable_isNewReconciler: false };
function Ki(a2, b) {
  try {
    var c = "", d2 = b;
    do
      c += Pa(d2), d2 = d2.return;
    while (d2);
    var e = c;
  } catch (f2) {
    e = "\nError generating stack: " + f2.message + "\n" + f2.stack;
  }
  return { value: a2, source: b, stack: e, digest: null };
}
function Li(a2, b, c) {
  return { value: a2, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
}
function Mi(a2, b) {
  try {
    console.error(b.value);
  } catch (c) {
    setTimeout(function() {
      throw c;
    });
  }
}
var Ni = "function" === typeof WeakMap ? WeakMap : Map;
function Oi(a2, b, c) {
  c = ch(-1, c);
  c.tag = 3;
  c.payload = { element: null };
  var d2 = b.value;
  c.callback = function() {
    Pi || (Pi = true, Qi = d2);
    Mi(a2, b);
  };
  return c;
}
function Ri(a2, b, c) {
  c = ch(-1, c);
  c.tag = 3;
  var d2 = a2.type.getDerivedStateFromError;
  if ("function" === typeof d2) {
    var e = b.value;
    c.payload = function() {
      return d2(e);
    };
    c.callback = function() {
      Mi(a2, b);
    };
  }
  var f2 = a2.stateNode;
  null !== f2 && "function" === typeof f2.componentDidCatch && (c.callback = function() {
    Mi(a2, b);
    "function" !== typeof d2 && (null === Si ? Si = /* @__PURE__ */ new Set([this]) : Si.add(this));
    var c2 = b.stack;
    this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
  });
  return c;
}
function Ti(a2, b, c) {
  var d2 = a2.pingCache;
  if (null === d2) {
    d2 = a2.pingCache = new Ni();
    var e = /* @__PURE__ */ new Set();
    d2.set(b, e);
  } else e = d2.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d2.set(b, e));
  e.has(c) || (e.add(c), a2 = Ui.bind(null, a2, b, c), b.then(a2, a2));
}
function Vi(a2) {
  do {
    var b;
    if (b = 13 === a2.tag) b = a2.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
    if (b) return a2;
    a2 = a2.return;
  } while (null !== a2);
  return null;
}
function Wi(a2, b, c, d2, e) {
  if (0 === (a2.mode & 1)) return a2 === b ? a2.flags |= 65536 : (a2.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = ch(-1, 1), b.tag = 2, dh(c, b, 1))), c.lanes |= 1), a2;
  a2.flags |= 65536;
  a2.lanes = e;
  return a2;
}
var Xi = ua$1.ReactCurrentOwner, Ug = false;
function Yi(a2, b, c, d2) {
  b.child = null === a2 ? Ch(b, null, c, d2) : Bh(b, a2.child, c, d2);
}
function Zi(a2, b, c, d2, e) {
  c = c.render;
  var f2 = b.ref;
  Tg(b, e);
  d2 = Xh(a2, b, c, d2, f2, e);
  c = bi();
  if (null !== a2 && !Ug) return b.updateQueue = a2.updateQueue, b.flags &= -2053, a2.lanes &= ~e, $i(a2, b, e);
  I$2 && c && vg(b);
  b.flags |= 1;
  Yi(a2, b, d2, e);
  return b.child;
}
function aj(a2, b, c, d2, e) {
  if (null === a2) {
    var f2 = c.type;
    if ("function" === typeof f2 && !bj(f2) && void 0 === f2.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f2, cj(a2, b, f2, d2, e);
    a2 = yh(c.type, null, d2, b, b.mode, e);
    a2.ref = b.ref;
    a2.return = b;
    return b.child = a2;
  }
  f2 = a2.child;
  if (0 === (a2.lanes & e)) {
    var g2 = f2.memoizedProps;
    c = c.compare;
    c = null !== c ? c : Ie;
    if (c(g2, d2) && a2.ref === b.ref) return $i(a2, b, e);
  }
  b.flags |= 1;
  a2 = wh(f2, d2);
  a2.ref = b.ref;
  a2.return = b;
  return b.child = a2;
}
function cj(a2, b, c, d2, e) {
  if (null !== a2) {
    var f2 = a2.memoizedProps;
    if (Ie(f2, d2) && a2.ref === b.ref) if (Ug = false, b.pendingProps = d2 = f2, 0 !== (a2.lanes & e)) 0 !== (a2.flags & 131072) && (Ug = true);
    else return b.lanes = a2.lanes, $i(a2, b, e);
  }
  return dj(a2, b, c, d2, e);
}
function ej(a2, b, c) {
  var d2 = b.pendingProps, e = d2.children, f2 = null !== a2 ? a2.memoizedState : null;
  if ("hidden" === d2.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G$1(fj, gj), gj |= c;
  else {
    if (0 === (c & 1073741824)) return a2 = null !== f2 ? f2.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a2, cachePool: null, transitions: null }, b.updateQueue = null, G$1(fj, gj), gj |= a2, null;
    b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
    d2 = null !== f2 ? f2.baseLanes : c;
    G$1(fj, gj);
    gj |= d2;
  }
  else null !== f2 ? (d2 = f2.baseLanes | c, b.memoizedState = null) : d2 = c, G$1(fj, gj), gj |= d2;
  Yi(a2, b, e, c);
  return b.child;
}
function hj(a2, b) {
  var c = b.ref;
  if (null === a2 && null !== c || null !== a2 && a2.ref !== c) b.flags |= 512, b.flags |= 2097152;
}
function dj(a2, b, c, d2, e) {
  var f2 = Zf(c) ? Xf : H.current;
  f2 = Yf(b, f2);
  Tg(b, e);
  c = Xh(a2, b, c, d2, f2, e);
  d2 = bi();
  if (null !== a2 && !Ug) return b.updateQueue = a2.updateQueue, b.flags &= -2053, a2.lanes &= ~e, $i(a2, b, e);
  I$2 && d2 && vg(b);
  b.flags |= 1;
  Yi(a2, b, c, e);
  return b.child;
}
function ij(a2, b, c, d2, e) {
  if (Zf(c)) {
    var f2 = true;
    cg(b);
  } else f2 = false;
  Tg(b, e);
  if (null === b.stateNode) jj(a2, b), ph(b, c, d2), rh(b, c, d2, e), d2 = true;
  else if (null === a2) {
    var g2 = b.stateNode, h = b.memoizedProps;
    g2.props = h;
    var k = g2.context, l2 = c.contextType;
    "object" === typeof l2 && null !== l2 ? l2 = Vg(l2) : (l2 = Zf(c) ? Xf : H.current, l2 = Yf(b, l2));
    var m2 = c.getDerivedStateFromProps, q2 = "function" === typeof m2 || "function" === typeof g2.getSnapshotBeforeUpdate;
    q2 || "function" !== typeof g2.UNSAFE_componentWillReceiveProps && "function" !== typeof g2.componentWillReceiveProps || (h !== d2 || k !== l2) && qh(b, g2, d2, l2);
    $g = false;
    var r2 = b.memoizedState;
    g2.state = r2;
    gh(b, d2, g2, e);
    k = b.memoizedState;
    h !== d2 || r2 !== k || Wf.current || $g ? ("function" === typeof m2 && (kh(b, c, m2, d2), k = b.memoizedState), (h = $g || oh(b, c, h, d2, r2, k, l2)) ? (q2 || "function" !== typeof g2.UNSAFE_componentWillMount && "function" !== typeof g2.componentWillMount || ("function" === typeof g2.componentWillMount && g2.componentWillMount(), "function" === typeof g2.UNSAFE_componentWillMount && g2.UNSAFE_componentWillMount()), "function" === typeof g2.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g2.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d2, b.memoizedState = k), g2.props = d2, g2.state = k, g2.context = l2, d2 = h) : ("function" === typeof g2.componentDidMount && (b.flags |= 4194308), d2 = false);
  } else {
    g2 = b.stateNode;
    bh(a2, b);
    h = b.memoizedProps;
    l2 = b.type === b.elementType ? h : Lg(b.type, h);
    g2.props = l2;
    q2 = b.pendingProps;
    r2 = g2.context;
    k = c.contextType;
    "object" === typeof k && null !== k ? k = Vg(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
    var y2 = c.getDerivedStateFromProps;
    (m2 = "function" === typeof y2 || "function" === typeof g2.getSnapshotBeforeUpdate) || "function" !== typeof g2.UNSAFE_componentWillReceiveProps && "function" !== typeof g2.componentWillReceiveProps || (h !== q2 || r2 !== k) && qh(b, g2, d2, k);
    $g = false;
    r2 = b.memoizedState;
    g2.state = r2;
    gh(b, d2, g2, e);
    var n2 = b.memoizedState;
    h !== q2 || r2 !== n2 || Wf.current || $g ? ("function" === typeof y2 && (kh(b, c, y2, d2), n2 = b.memoizedState), (l2 = $g || oh(b, c, l2, d2, r2, n2, k) || false) ? (m2 || "function" !== typeof g2.UNSAFE_componentWillUpdate && "function" !== typeof g2.componentWillUpdate || ("function" === typeof g2.componentWillUpdate && g2.componentWillUpdate(d2, n2, k), "function" === typeof g2.UNSAFE_componentWillUpdate && g2.UNSAFE_componentWillUpdate(d2, n2, k)), "function" === typeof g2.componentDidUpdate && (b.flags |= 4), "function" === typeof g2.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g2.componentDidUpdate || h === a2.memoizedProps && r2 === a2.memoizedState || (b.flags |= 4), "function" !== typeof g2.getSnapshotBeforeUpdate || h === a2.memoizedProps && r2 === a2.memoizedState || (b.flags |= 1024), b.memoizedProps = d2, b.memoizedState = n2), g2.props = d2, g2.state = n2, g2.context = k, d2 = l2) : ("function" !== typeof g2.componentDidUpdate || h === a2.memoizedProps && r2 === a2.memoizedState || (b.flags |= 4), "function" !== typeof g2.getSnapshotBeforeUpdate || h === a2.memoizedProps && r2 === a2.memoizedState || (b.flags |= 1024), d2 = false);
  }
  return kj(a2, b, c, d2, f2, e);
}
function kj(a2, b, c, d2, e, f2) {
  hj(a2, b);
  var g2 = 0 !== (b.flags & 128);
  if (!d2 && !g2) return e && dg(b, c, false), $i(a2, b, f2);
  d2 = b.stateNode;
  Xi.current = b;
  var h = g2 && "function" !== typeof c.getDerivedStateFromError ? null : d2.render();
  b.flags |= 1;
  null !== a2 && g2 ? (b.child = Bh(b, a2.child, null, f2), b.child = Bh(b, null, h, f2)) : Yi(a2, b, h, f2);
  b.memoizedState = d2.state;
  e && dg(b, c, true);
  return b.child;
}
function lj(a2) {
  var b = a2.stateNode;
  b.pendingContext ? ag(a2, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a2, b.context, false);
  Ih(a2, b.containerInfo);
}
function mj(a2, b, c, d2, e) {
  Ig();
  Jg(e);
  b.flags |= 256;
  Yi(a2, b, c, d2);
  return b.child;
}
var nj = { dehydrated: null, treeContext: null, retryLane: 0 };
function oj(a2) {
  return { baseLanes: a2, cachePool: null, transitions: null };
}
function pj(a2, b, c) {
  var d2 = b.pendingProps, e = M.current, f2 = false, g2 = 0 !== (b.flags & 128), h;
  (h = g2) || (h = null !== a2 && null === a2.memoizedState ? false : 0 !== (e & 2));
  if (h) f2 = true, b.flags &= -129;
  else if (null === a2 || null !== a2.memoizedState) e |= 1;
  G$1(M, e & 1);
  if (null === a2) {
    Eg(b);
    a2 = b.memoizedState;
    if (null !== a2 && (a2 = a2.dehydrated, null !== a2)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a2.data ? b.lanes = 8 : b.lanes = 1073741824, null;
    g2 = d2.children;
    a2 = d2.fallback;
    return f2 ? (d2 = b.mode, f2 = b.child, g2 = { mode: "hidden", children: g2 }, 0 === (d2 & 1) && null !== f2 ? (f2.childLanes = 0, f2.pendingProps = g2) : f2 = qj(g2, d2, 0, null), a2 = Ah(a2, d2, c, null), f2.return = b, a2.return = b, f2.sibling = a2, b.child = f2, b.child.memoizedState = oj(c), b.memoizedState = nj, a2) : rj(b, g2);
  }
  e = a2.memoizedState;
  if (null !== e && (h = e.dehydrated, null !== h)) return sj(a2, b, g2, d2, h, e, c);
  if (f2) {
    f2 = d2.fallback;
    g2 = b.mode;
    e = a2.child;
    h = e.sibling;
    var k = { mode: "hidden", children: d2.children };
    0 === (g2 & 1) && b.child !== e ? (d2 = b.child, d2.childLanes = 0, d2.pendingProps = k, b.deletions = null) : (d2 = wh(e, k), d2.subtreeFlags = e.subtreeFlags & 14680064);
    null !== h ? f2 = wh(h, f2) : (f2 = Ah(f2, g2, c, null), f2.flags |= 2);
    f2.return = b;
    d2.return = b;
    d2.sibling = f2;
    b.child = d2;
    d2 = f2;
    f2 = b.child;
    g2 = a2.child.memoizedState;
    g2 = null === g2 ? oj(c) : { baseLanes: g2.baseLanes | c, cachePool: null, transitions: g2.transitions };
    f2.memoizedState = g2;
    f2.childLanes = a2.childLanes & ~c;
    b.memoizedState = nj;
    return d2;
  }
  f2 = a2.child;
  a2 = f2.sibling;
  d2 = wh(f2, { mode: "visible", children: d2.children });
  0 === (b.mode & 1) && (d2.lanes = c);
  d2.return = b;
  d2.sibling = null;
  null !== a2 && (c = b.deletions, null === c ? (b.deletions = [a2], b.flags |= 16) : c.push(a2));
  b.child = d2;
  b.memoizedState = null;
  return d2;
}
function rj(a2, b) {
  b = qj({ mode: "visible", children: b }, a2.mode, 0, null);
  b.return = a2;
  return a2.child = b;
}
function tj(a2, b, c, d2) {
  null !== d2 && Jg(d2);
  Bh(b, a2.child, null, c);
  a2 = rj(b, b.pendingProps.children);
  a2.flags |= 2;
  b.memoizedState = null;
  return a2;
}
function sj(a2, b, c, d2, e, f2, g2) {
  if (c) {
    if (b.flags & 256) return b.flags &= -257, d2 = Li(Error(p$3(422))), tj(a2, b, g2, d2);
    if (null !== b.memoizedState) return b.child = a2.child, b.flags |= 128, null;
    f2 = d2.fallback;
    e = b.mode;
    d2 = qj({ mode: "visible", children: d2.children }, e, 0, null);
    f2 = Ah(f2, e, g2, null);
    f2.flags |= 2;
    d2.return = b;
    f2.return = b;
    d2.sibling = f2;
    b.child = d2;
    0 !== (b.mode & 1) && Bh(b, a2.child, null, g2);
    b.child.memoizedState = oj(g2);
    b.memoizedState = nj;
    return f2;
  }
  if (0 === (b.mode & 1)) return tj(a2, b, g2, null);
  if ("$!" === e.data) {
    d2 = e.nextSibling && e.nextSibling.dataset;
    if (d2) var h = d2.dgst;
    d2 = h;
    f2 = Error(p$3(419));
    d2 = Li(f2, d2, void 0);
    return tj(a2, b, g2, d2);
  }
  h = 0 !== (g2 & a2.childLanes);
  if (Ug || h) {
    d2 = R;
    if (null !== d2) {
      switch (g2 & -g2) {
        case 4:
          e = 2;
          break;
        case 16:
          e = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          e = 32;
          break;
        case 536870912:
          e = 268435456;
          break;
        default:
          e = 0;
      }
      e = 0 !== (e & (d2.suspendedLanes | g2)) ? 0 : e;
      0 !== e && e !== f2.retryLane && (f2.retryLane = e, Zg(a2, e), mh(d2, a2, e, -1));
    }
    uj();
    d2 = Li(Error(p$3(421)));
    return tj(a2, b, g2, d2);
  }
  if ("$?" === e.data) return b.flags |= 128, b.child = a2.child, b = vj.bind(null, a2), e._reactRetry = b, null;
  a2 = f2.treeContext;
  yg = Lf(e.nextSibling);
  xg = b;
  I$2 = true;
  zg = null;
  null !== a2 && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a2.id, sg = a2.overflow, qg = b);
  b = rj(b, d2.children);
  b.flags |= 4096;
  return b;
}
function wj(a2, b, c) {
  a2.lanes |= b;
  var d2 = a2.alternate;
  null !== d2 && (d2.lanes |= b);
  Sg(a2.return, b, c);
}
function xj(a2, b, c, d2, e) {
  var f2 = a2.memoizedState;
  null === f2 ? a2.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d2, tail: c, tailMode: e } : (f2.isBackwards = b, f2.rendering = null, f2.renderingStartTime = 0, f2.last = d2, f2.tail = c, f2.tailMode = e);
}
function yj(a2, b, c) {
  var d2 = b.pendingProps, e = d2.revealOrder, f2 = d2.tail;
  Yi(a2, b, d2.children, c);
  d2 = M.current;
  if (0 !== (d2 & 2)) d2 = d2 & 1 | 2, b.flags |= 128;
  else {
    if (null !== a2 && 0 !== (a2.flags & 128)) a: for (a2 = b.child; null !== a2; ) {
      if (13 === a2.tag) null !== a2.memoizedState && wj(a2, c, b);
      else if (19 === a2.tag) wj(a2, c, b);
      else if (null !== a2.child) {
        a2.child.return = a2;
        a2 = a2.child;
        continue;
      }
      if (a2 === b) break a;
      for (; null === a2.sibling; ) {
        if (null === a2.return || a2.return === b) break a;
        a2 = a2.return;
      }
      a2.sibling.return = a2.return;
      a2 = a2.sibling;
    }
    d2 &= 1;
  }
  G$1(M, d2);
  if (0 === (b.mode & 1)) b.memoizedState = null;
  else switch (e) {
    case "forwards":
      c = b.child;
      for (e = null; null !== c; ) a2 = c.alternate, null !== a2 && null === Mh(a2) && (e = c), c = c.sibling;
      c = e;
      null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
      xj(b, false, e, c, f2);
      break;
    case "backwards":
      c = null;
      e = b.child;
      for (b.child = null; null !== e; ) {
        a2 = e.alternate;
        if (null !== a2 && null === Mh(a2)) {
          b.child = e;
          break;
        }
        a2 = e.sibling;
        e.sibling = c;
        c = e;
        e = a2;
      }
      xj(b, true, c, null, f2);
      break;
    case "together":
      xj(b, false, null, null, void 0);
      break;
    default:
      b.memoizedState = null;
  }
  return b.child;
}
function jj(a2, b) {
  0 === (b.mode & 1) && null !== a2 && (a2.alternate = null, b.alternate = null, b.flags |= 2);
}
function $i(a2, b, c) {
  null !== a2 && (b.dependencies = a2.dependencies);
  hh |= b.lanes;
  if (0 === (c & b.childLanes)) return null;
  if (null !== a2 && b.child !== a2.child) throw Error(p$3(153));
  if (null !== b.child) {
    a2 = b.child;
    c = wh(a2, a2.pendingProps);
    b.child = c;
    for (c.return = b; null !== a2.sibling; ) a2 = a2.sibling, c = c.sibling = wh(a2, a2.pendingProps), c.return = b;
    c.sibling = null;
  }
  return b.child;
}
function zj(a2, b, c) {
  switch (b.tag) {
    case 3:
      lj(b);
      Ig();
      break;
    case 5:
      Kh(b);
      break;
    case 1:
      Zf(b.type) && cg(b);
      break;
    case 4:
      Ih(b, b.stateNode.containerInfo);
      break;
    case 10:
      var d2 = b.type._context, e = b.memoizedProps.value;
      G$1(Mg, d2._currentValue);
      d2._currentValue = e;
      break;
    case 13:
      d2 = b.memoizedState;
      if (null !== d2) {
        if (null !== d2.dehydrated) return G$1(M, M.current & 1), b.flags |= 128, null;
        if (0 !== (c & b.child.childLanes)) return pj(a2, b, c);
        G$1(M, M.current & 1);
        a2 = $i(a2, b, c);
        return null !== a2 ? a2.sibling : null;
      }
      G$1(M, M.current & 1);
      break;
    case 19:
      d2 = 0 !== (c & b.childLanes);
      if (0 !== (a2.flags & 128)) {
        if (d2) return yj(a2, b, c);
        b.flags |= 128;
      }
      e = b.memoizedState;
      null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
      G$1(M, M.current);
      if (d2) break;
      else return null;
    case 22:
    case 23:
      return b.lanes = 0, ej(a2, b, c);
  }
  return $i(a2, b, c);
}
var Aj, Bj, Cj, Dj;
Aj = function(a2, b) {
  for (var c = b.child; null !== c; ) {
    if (5 === c.tag || 6 === c.tag) a2.appendChild(c.stateNode);
    else if (4 !== c.tag && null !== c.child) {
      c.child.return = c;
      c = c.child;
      continue;
    }
    if (c === b) break;
    for (; null === c.sibling; ) {
      if (null === c.return || c.return === b) return;
      c = c.return;
    }
    c.sibling.return = c.return;
    c = c.sibling;
  }
};
Bj = function() {
};
Cj = function(a2, b, c, d2) {
  var e = a2.memoizedProps;
  if (e !== d2) {
    a2 = b.stateNode;
    Hh(Eh.current);
    var f2 = null;
    switch (c) {
      case "input":
        e = Ya(a2, e);
        d2 = Ya(a2, d2);
        f2 = [];
        break;
      case "select":
        e = A$1({}, e, { value: void 0 });
        d2 = A$1({}, d2, { value: void 0 });
        f2 = [];
        break;
      case "textarea":
        e = gb(a2, e);
        d2 = gb(a2, d2);
        f2 = [];
        break;
      default:
        "function" !== typeof e.onClick && "function" === typeof d2.onClick && (a2.onclick = Bf);
    }
    ub(c, d2);
    var g2;
    c = null;
    for (l2 in e) if (!d2.hasOwnProperty(l2) && e.hasOwnProperty(l2) && null != e[l2]) if ("style" === l2) {
      var h = e[l2];
      for (g2 in h) h.hasOwnProperty(g2) && (c || (c = {}), c[g2] = "");
    } else "dangerouslySetInnerHTML" !== l2 && "children" !== l2 && "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && "autoFocus" !== l2 && (ea.hasOwnProperty(l2) ? f2 || (f2 = []) : (f2 = f2 || []).push(l2, null));
    for (l2 in d2) {
      var k = d2[l2];
      h = null != e ? e[l2] : void 0;
      if (d2.hasOwnProperty(l2) && k !== h && (null != k || null != h)) if ("style" === l2) if (h) {
        for (g2 in h) !h.hasOwnProperty(g2) || k && k.hasOwnProperty(g2) || (c || (c = {}), c[g2] = "");
        for (g2 in k) k.hasOwnProperty(g2) && h[g2] !== k[g2] && (c || (c = {}), c[g2] = k[g2]);
      } else c || (f2 || (f2 = []), f2.push(
        l2,
        c
      )), c = k;
      else "dangerouslySetInnerHTML" === l2 ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f2 = f2 || []).push(l2, k)) : "children" === l2 ? "string" !== typeof k && "number" !== typeof k || (f2 = f2 || []).push(l2, "" + k) : "suppressContentEditableWarning" !== l2 && "suppressHydrationWarning" !== l2 && (ea.hasOwnProperty(l2) ? (null != k && "onScroll" === l2 && D("scroll", a2), f2 || h === k || (f2 = [])) : (f2 = f2 || []).push(l2, k));
    }
    c && (f2 = f2 || []).push("style", c);
    var l2 = f2;
    if (b.updateQueue = l2) b.flags |= 4;
  }
};
Dj = function(a2, b, c, d2) {
  c !== d2 && (b.flags |= 4);
};
function Ej(a2, b) {
  if (!I$2) switch (a2.tailMode) {
    case "hidden":
      b = a2.tail;
      for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
      null === c ? a2.tail = null : c.sibling = null;
      break;
    case "collapsed":
      c = a2.tail;
      for (var d2 = null; null !== c; ) null !== c.alternate && (d2 = c), c = c.sibling;
      null === d2 ? b || null === a2.tail ? a2.tail = null : a2.tail.sibling = null : d2.sibling = null;
  }
}
function S$1(a2) {
  var b = null !== a2.alternate && a2.alternate.child === a2.child, c = 0, d2 = 0;
  if (b) for (var e = a2.child; null !== e; ) c |= e.lanes | e.childLanes, d2 |= e.subtreeFlags & 14680064, d2 |= e.flags & 14680064, e.return = a2, e = e.sibling;
  else for (e = a2.child; null !== e; ) c |= e.lanes | e.childLanes, d2 |= e.subtreeFlags, d2 |= e.flags, e.return = a2, e = e.sibling;
  a2.subtreeFlags |= d2;
  a2.childLanes = c;
  return b;
}
function Fj(a2, b, c) {
  var d2 = b.pendingProps;
  wg(b);
  switch (b.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return S$1(b), null;
    case 1:
      return Zf(b.type) && $f(), S$1(b), null;
    case 3:
      d2 = b.stateNode;
      Jh();
      E(Wf);
      E(H);
      Oh();
      d2.pendingContext && (d2.context = d2.pendingContext, d2.pendingContext = null);
      if (null === a2 || null === a2.child) Gg(b) ? b.flags |= 4 : null === a2 || a2.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Gj(zg), zg = null));
      Bj(a2, b);
      S$1(b);
      return null;
    case 5:
      Lh(b);
      var e = Hh(Gh.current);
      c = b.type;
      if (null !== a2 && null != b.stateNode) Cj(a2, b, c, d2, e), a2.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      else {
        if (!d2) {
          if (null === b.stateNode) throw Error(p$3(166));
          S$1(b);
          return null;
        }
        a2 = Hh(Eh.current);
        if (Gg(b)) {
          d2 = b.stateNode;
          c = b.type;
          var f2 = b.memoizedProps;
          d2[Of] = b;
          d2[Pf] = f2;
          a2 = 0 !== (b.mode & 1);
          switch (c) {
            case "dialog":
              D("cancel", d2);
              D("close", d2);
              break;
            case "iframe":
            case "object":
            case "embed":
              D("load", d2);
              break;
            case "video":
            case "audio":
              for (e = 0; e < lf.length; e++) D(lf[e], d2);
              break;
            case "source":
              D("error", d2);
              break;
            case "img":
            case "image":
            case "link":
              D(
                "error",
                d2
              );
              D("load", d2);
              break;
            case "details":
              D("toggle", d2);
              break;
            case "input":
              Za(d2, f2);
              D("invalid", d2);
              break;
            case "select":
              d2._wrapperState = { wasMultiple: !!f2.multiple };
              D("invalid", d2);
              break;
            case "textarea":
              hb(d2, f2), D("invalid", d2);
          }
          ub(c, f2);
          e = null;
          for (var g2 in f2) if (f2.hasOwnProperty(g2)) {
            var h = f2[g2];
            "children" === g2 ? "string" === typeof h ? d2.textContent !== h && (true !== f2.suppressHydrationWarning && Af(d2.textContent, h, a2), e = ["children", h]) : "number" === typeof h && d2.textContent !== "" + h && (true !== f2.suppressHydrationWarning && Af(
              d2.textContent,
              h,
              a2
            ), e = ["children", "" + h]) : ea.hasOwnProperty(g2) && null != h && "onScroll" === g2 && D("scroll", d2);
          }
          switch (c) {
            case "input":
              Va(d2);
              db(d2, f2, true);
              break;
            case "textarea":
              Va(d2);
              jb(d2);
              break;
            case "select":
            case "option":
              break;
            default:
              "function" === typeof f2.onClick && (d2.onclick = Bf);
          }
          d2 = e;
          b.updateQueue = d2;
          null !== d2 && (b.flags |= 4);
        } else {
          g2 = 9 === e.nodeType ? e : e.ownerDocument;
          "http://www.w3.org/1999/xhtml" === a2 && (a2 = kb(c));
          "http://www.w3.org/1999/xhtml" === a2 ? "script" === c ? (a2 = g2.createElement("div"), a2.innerHTML = "<script><\/script>", a2 = a2.removeChild(a2.firstChild)) : "string" === typeof d2.is ? a2 = g2.createElement(c, { is: d2.is }) : (a2 = g2.createElement(c), "select" === c && (g2 = a2, d2.multiple ? g2.multiple = true : d2.size && (g2.size = d2.size))) : a2 = g2.createElementNS(a2, c);
          a2[Of] = b;
          a2[Pf] = d2;
          Aj(a2, b, false, false);
          b.stateNode = a2;
          a: {
            g2 = vb(c, d2);
            switch (c) {
              case "dialog":
                D("cancel", a2);
                D("close", a2);
                e = d2;
                break;
              case "iframe":
              case "object":
              case "embed":
                D("load", a2);
                e = d2;
                break;
              case "video":
              case "audio":
                for (e = 0; e < lf.length; e++) D(lf[e], a2);
                e = d2;
                break;
              case "source":
                D("error", a2);
                e = d2;
                break;
              case "img":
              case "image":
              case "link":
                D(
                  "error",
                  a2
                );
                D("load", a2);
                e = d2;
                break;
              case "details":
                D("toggle", a2);
                e = d2;
                break;
              case "input":
                Za(a2, d2);
                e = Ya(a2, d2);
                D("invalid", a2);
                break;
              case "option":
                e = d2;
                break;
              case "select":
                a2._wrapperState = { wasMultiple: !!d2.multiple };
                e = A$1({}, d2, { value: void 0 });
                D("invalid", a2);
                break;
              case "textarea":
                hb(a2, d2);
                e = gb(a2, d2);
                D("invalid", a2);
                break;
              default:
                e = d2;
            }
            ub(c, e);
            h = e;
            for (f2 in h) if (h.hasOwnProperty(f2)) {
              var k = h[f2];
              "style" === f2 ? sb(a2, k) : "dangerouslySetInnerHTML" === f2 ? (k = k ? k.__html : void 0, null != k && nb(a2, k)) : "children" === f2 ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a2, k) : "number" === typeof k && ob(a2, "" + k) : "suppressContentEditableWarning" !== f2 && "suppressHydrationWarning" !== f2 && "autoFocus" !== f2 && (ea.hasOwnProperty(f2) ? null != k && "onScroll" === f2 && D("scroll", a2) : null != k && ta(a2, f2, k, g2));
            }
            switch (c) {
              case "input":
                Va(a2);
                db(a2, d2, false);
                break;
              case "textarea":
                Va(a2);
                jb(a2);
                break;
              case "option":
                null != d2.value && a2.setAttribute("value", "" + Sa(d2.value));
                break;
              case "select":
                a2.multiple = !!d2.multiple;
                f2 = d2.value;
                null != f2 ? fb(a2, !!d2.multiple, f2, false) : null != d2.defaultValue && fb(
                  a2,
                  !!d2.multiple,
                  d2.defaultValue,
                  true
                );
                break;
              default:
                "function" === typeof e.onClick && (a2.onclick = Bf);
            }
            switch (c) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                d2 = !!d2.autoFocus;
                break a;
              case "img":
                d2 = true;
                break a;
              default:
                d2 = false;
            }
          }
          d2 && (b.flags |= 4);
        }
        null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
      }
      S$1(b);
      return null;
    case 6:
      if (a2 && null != b.stateNode) Dj(a2, b, a2.memoizedProps, d2);
      else {
        if ("string" !== typeof d2 && null === b.stateNode) throw Error(p$3(166));
        c = Hh(Gh.current);
        Hh(Eh.current);
        if (Gg(b)) {
          d2 = b.stateNode;
          c = b.memoizedProps;
          d2[Of] = b;
          if (f2 = d2.nodeValue !== c) {
            if (a2 = xg, null !== a2) switch (a2.tag) {
              case 3:
                Af(d2.nodeValue, c, 0 !== (a2.mode & 1));
                break;
              case 5:
                true !== a2.memoizedProps.suppressHydrationWarning && Af(d2.nodeValue, c, 0 !== (a2.mode & 1));
            }
          }
          f2 && (b.flags |= 4);
        } else d2 = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d2), d2[Of] = b, b.stateNode = d2;
      }
      S$1(b);
      return null;
    case 13:
      E(M);
      d2 = b.memoizedState;
      if (null === a2 || null !== a2.memoizedState && null !== a2.memoizedState.dehydrated) {
        if (I$2 && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f2 = false;
        else if (f2 = Gg(b), null !== d2 && null !== d2.dehydrated) {
          if (null === a2) {
            if (!f2) throw Error(p$3(318));
            f2 = b.memoizedState;
            f2 = null !== f2 ? f2.dehydrated : null;
            if (!f2) throw Error(p$3(317));
            f2[Of] = b;
          } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
          S$1(b);
          f2 = false;
        } else null !== zg && (Gj(zg), zg = null), f2 = true;
        if (!f2) return b.flags & 65536 ? b : null;
      }
      if (0 !== (b.flags & 128)) return b.lanes = c, b;
      d2 = null !== d2;
      d2 !== (null !== a2 && null !== a2.memoizedState) && d2 && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a2 || 0 !== (M.current & 1) ? 0 === T && (T = 3) : uj()));
      null !== b.updateQueue && (b.flags |= 4);
      S$1(b);
      return null;
    case 4:
      return Jh(), Bj(a2, b), null === a2 && sf(b.stateNode.containerInfo), S$1(b), null;
    case 10:
      return Rg(b.type._context), S$1(b), null;
    case 17:
      return Zf(b.type) && $f(), S$1(b), null;
    case 19:
      E(M);
      f2 = b.memoizedState;
      if (null === f2) return S$1(b), null;
      d2 = 0 !== (b.flags & 128);
      g2 = f2.rendering;
      if (null === g2) if (d2) Ej(f2, false);
      else {
        if (0 !== T || null !== a2 && 0 !== (a2.flags & 128)) for (a2 = b.child; null !== a2; ) {
          g2 = Mh(a2);
          if (null !== g2) {
            b.flags |= 128;
            Ej(f2, false);
            d2 = g2.updateQueue;
            null !== d2 && (b.updateQueue = d2, b.flags |= 4);
            b.subtreeFlags = 0;
            d2 = c;
            for (c = b.child; null !== c; ) f2 = c, a2 = d2, f2.flags &= 14680066, g2 = f2.alternate, null === g2 ? (f2.childLanes = 0, f2.lanes = a2, f2.child = null, f2.subtreeFlags = 0, f2.memoizedProps = null, f2.memoizedState = null, f2.updateQueue = null, f2.dependencies = null, f2.stateNode = null) : (f2.childLanes = g2.childLanes, f2.lanes = g2.lanes, f2.child = g2.child, f2.subtreeFlags = 0, f2.deletions = null, f2.memoizedProps = g2.memoizedProps, f2.memoizedState = g2.memoizedState, f2.updateQueue = g2.updateQueue, f2.type = g2.type, a2 = g2.dependencies, f2.dependencies = null === a2 ? null : { lanes: a2.lanes, firstContext: a2.firstContext }), c = c.sibling;
            G$1(M, M.current & 1 | 2);
            return b.child;
          }
          a2 = a2.sibling;
        }
        null !== f2.tail && B() > Hj && (b.flags |= 128, d2 = true, Ej(f2, false), b.lanes = 4194304);
      }
      else {
        if (!d2) if (a2 = Mh(g2), null !== a2) {
          if (b.flags |= 128, d2 = true, c = a2.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Ej(f2, true), null === f2.tail && "hidden" === f2.tailMode && !g2.alternate && !I$2) return S$1(b), null;
        } else 2 * B() - f2.renderingStartTime > Hj && 1073741824 !== c && (b.flags |= 128, d2 = true, Ej(f2, false), b.lanes = 4194304);
        f2.isBackwards ? (g2.sibling = b.child, b.child = g2) : (c = f2.last, null !== c ? c.sibling = g2 : b.child = g2, f2.last = g2);
      }
      if (null !== f2.tail) return b = f2.tail, f2.rendering = b, f2.tail = b.sibling, f2.renderingStartTime = B(), b.sibling = null, c = M.current, G$1(M, d2 ? c & 1 | 2 : c & 1), b;
      S$1(b);
      return null;
    case 22:
    case 23:
      return Ij(), d2 = null !== b.memoizedState, null !== a2 && null !== a2.memoizedState !== d2 && (b.flags |= 8192), d2 && 0 !== (b.mode & 1) ? 0 !== (gj & 1073741824) && (S$1(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S$1(b), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(p$3(156, b.tag));
}
function Jj(a2, b) {
  wg(b);
  switch (b.tag) {
    case 1:
      return Zf(b.type) && $f(), a2 = b.flags, a2 & 65536 ? (b.flags = a2 & -65537 | 128, b) : null;
    case 3:
      return Jh(), E(Wf), E(H), Oh(), a2 = b.flags, 0 !== (a2 & 65536) && 0 === (a2 & 128) ? (b.flags = a2 & -65537 | 128, b) : null;
    case 5:
      return Lh(b), null;
    case 13:
      E(M);
      a2 = b.memoizedState;
      if (null !== a2 && null !== a2.dehydrated) {
        if (null === b.alternate) throw Error(p$3(340));
        Ig();
      }
      a2 = b.flags;
      return a2 & 65536 ? (b.flags = a2 & -65537 | 128, b) : null;
    case 19:
      return E(M), null;
    case 4:
      return Jh(), null;
    case 10:
      return Rg(b.type._context), null;
    case 22:
    case 23:
      return Ij(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Kj = false, U = false, Lj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
function Mj(a2, b) {
  var c = a2.ref;
  if (null !== c) if ("function" === typeof c) try {
    c(null);
  } catch (d2) {
    W(a2, b, d2);
  }
  else c.current = null;
}
function Nj(a2, b, c) {
  try {
    c();
  } catch (d2) {
    W(a2, b, d2);
  }
}
var Oj = false;
function Pj(a2, b) {
  Cf = dd;
  a2 = Me();
  if (Ne(a2)) {
    if ("selectionStart" in a2) var c = { start: a2.selectionStart, end: a2.selectionEnd };
    else a: {
      c = (c = a2.ownerDocument) && c.defaultView || window;
      var d2 = c.getSelection && c.getSelection();
      if (d2 && 0 !== d2.rangeCount) {
        c = d2.anchorNode;
        var e = d2.anchorOffset, f2 = d2.focusNode;
        d2 = d2.focusOffset;
        try {
          c.nodeType, f2.nodeType;
        } catch (F2) {
          c = null;
          break a;
        }
        var g2 = 0, h = -1, k = -1, l2 = 0, m2 = 0, q2 = a2, r2 = null;
        b: for (; ; ) {
          for (var y2; ; ) {
            q2 !== c || 0 !== e && 3 !== q2.nodeType || (h = g2 + e);
            q2 !== f2 || 0 !== d2 && 3 !== q2.nodeType || (k = g2 + d2);
            3 === q2.nodeType && (g2 += q2.nodeValue.length);
            if (null === (y2 = q2.firstChild)) break;
            r2 = q2;
            q2 = y2;
          }
          for (; ; ) {
            if (q2 === a2) break b;
            r2 === c && ++l2 === e && (h = g2);
            r2 === f2 && ++m2 === d2 && (k = g2);
            if (null !== (y2 = q2.nextSibling)) break;
            q2 = r2;
            r2 = q2.parentNode;
          }
          q2 = y2;
        }
        c = -1 === h || -1 === k ? null : { start: h, end: k };
      } else c = null;
    }
    c = c || { start: 0, end: 0 };
  } else c = null;
  Df = { focusedElem: a2, selectionRange: c };
  dd = false;
  for (V = b; null !== V; ) if (b = V, a2 = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a2) a2.return = b, V = a2;
  else for (; null !== V; ) {
    b = V;
    try {
      var n2 = b.alternate;
      if (0 !== (b.flags & 1024)) switch (b.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (null !== n2) {
            var t2 = n2.memoizedProps, J2 = n2.memoizedState, x2 = b.stateNode, w2 = x2.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Lg(b.type, t2), J2);
            x2.__reactInternalSnapshotBeforeUpdate = w2;
          }
          break;
        case 3:
          var u2 = b.stateNode.containerInfo;
          1 === u2.nodeType ? u2.textContent = "" : 9 === u2.nodeType && u2.documentElement && u2.removeChild(u2.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(p$3(163));
      }
    } catch (F2) {
      W(b, b.return, F2);
    }
    a2 = b.sibling;
    if (null !== a2) {
      a2.return = b.return;
      V = a2;
      break;
    }
    V = b.return;
  }
  n2 = Oj;
  Oj = false;
  return n2;
}
function Qj(a2, b, c) {
  var d2 = b.updateQueue;
  d2 = null !== d2 ? d2.lastEffect : null;
  if (null !== d2) {
    var e = d2 = d2.next;
    do {
      if ((e.tag & a2) === a2) {
        var f2 = e.destroy;
        e.destroy = void 0;
        void 0 !== f2 && Nj(b, c, f2);
      }
      e = e.next;
    } while (e !== d2);
  }
}
function Rj(a2, b) {
  b = b.updateQueue;
  b = null !== b ? b.lastEffect : null;
  if (null !== b) {
    var c = b = b.next;
    do {
      if ((c.tag & a2) === a2) {
        var d2 = c.create;
        c.destroy = d2();
      }
      c = c.next;
    } while (c !== b);
  }
}
function Sj(a2) {
  var b = a2.ref;
  if (null !== b) {
    var c = a2.stateNode;
    switch (a2.tag) {
      case 5:
        a2 = c;
        break;
      default:
        a2 = c;
    }
    "function" === typeof b ? b(a2) : b.current = a2;
  }
}
function Tj(a2) {
  var b = a2.alternate;
  null !== b && (a2.alternate = null, Tj(b));
  a2.child = null;
  a2.deletions = null;
  a2.sibling = null;
  5 === a2.tag && (b = a2.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
  a2.stateNode = null;
  a2.return = null;
  a2.dependencies = null;
  a2.memoizedProps = null;
  a2.memoizedState = null;
  a2.pendingProps = null;
  a2.stateNode = null;
  a2.updateQueue = null;
}
function Uj(a2) {
  return 5 === a2.tag || 3 === a2.tag || 4 === a2.tag;
}
function Vj(a2) {
  a: for (; ; ) {
    for (; null === a2.sibling; ) {
      if (null === a2.return || Uj(a2.return)) return null;
      a2 = a2.return;
    }
    a2.sibling.return = a2.return;
    for (a2 = a2.sibling; 5 !== a2.tag && 6 !== a2.tag && 18 !== a2.tag; ) {
      if (a2.flags & 2) continue a;
      if (null === a2.child || 4 === a2.tag) continue a;
      else a2.child.return = a2, a2 = a2.child;
    }
    if (!(a2.flags & 2)) return a2.stateNode;
  }
}
function Wj(a2, b, c) {
  var d2 = a2.tag;
  if (5 === d2 || 6 === d2) a2 = a2.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a2, b) : c.insertBefore(a2, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a2, c)) : (b = c, b.appendChild(a2)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
  else if (4 !== d2 && (a2 = a2.child, null !== a2)) for (Wj(a2, b, c), a2 = a2.sibling; null !== a2; ) Wj(a2, b, c), a2 = a2.sibling;
}
function Xj(a2, b, c) {
  var d2 = a2.tag;
  if (5 === d2 || 6 === d2) a2 = a2.stateNode, b ? c.insertBefore(a2, b) : c.appendChild(a2);
  else if (4 !== d2 && (a2 = a2.child, null !== a2)) for (Xj(a2, b, c), a2 = a2.sibling; null !== a2; ) Xj(a2, b, c), a2 = a2.sibling;
}
var X = null, Yj = false;
function Zj(a2, b, c) {
  for (c = c.child; null !== c; ) ak(a2, b, c), c = c.sibling;
}
function ak(a2, b, c) {
  if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
    lc.onCommitFiberUnmount(kc, c);
  } catch (h) {
  }
  switch (c.tag) {
    case 5:
      U || Mj(c, b);
    case 6:
      var d2 = X, e = Yj;
      X = null;
      Zj(a2, b, c);
      X = d2;
      Yj = e;
      null !== X && (Yj ? (a2 = X, c = c.stateNode, 8 === a2.nodeType ? a2.parentNode.removeChild(c) : a2.removeChild(c)) : X.removeChild(c.stateNode));
      break;
    case 18:
      null !== X && (Yj ? (a2 = X, c = c.stateNode, 8 === a2.nodeType ? Kf(a2.parentNode, c) : 1 === a2.nodeType && Kf(a2, c), bd(a2)) : Kf(X, c.stateNode));
      break;
    case 4:
      d2 = X;
      e = Yj;
      X = c.stateNode.containerInfo;
      Yj = true;
      Zj(a2, b, c);
      X = d2;
      Yj = e;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!U && (d2 = c.updateQueue, null !== d2 && (d2 = d2.lastEffect, null !== d2))) {
        e = d2 = d2.next;
        do {
          var f2 = e, g2 = f2.destroy;
          f2 = f2.tag;
          void 0 !== g2 && (0 !== (f2 & 2) ? Nj(c, b, g2) : 0 !== (f2 & 4) && Nj(c, b, g2));
          e = e.next;
        } while (e !== d2);
      }
      Zj(a2, b, c);
      break;
    case 1:
      if (!U && (Mj(c, b), d2 = c.stateNode, "function" === typeof d2.componentWillUnmount)) try {
        d2.props = c.memoizedProps, d2.state = c.memoizedState, d2.componentWillUnmount();
      } catch (h) {
        W(c, b, h);
      }
      Zj(a2, b, c);
      break;
    case 21:
      Zj(a2, b, c);
      break;
    case 22:
      c.mode & 1 ? (U = (d2 = U) || null !== c.memoizedState, Zj(a2, b, c), U = d2) : Zj(a2, b, c);
      break;
    default:
      Zj(a2, b, c);
  }
}
function bk(a2) {
  var b = a2.updateQueue;
  if (null !== b) {
    a2.updateQueue = null;
    var c = a2.stateNode;
    null === c && (c = a2.stateNode = new Lj());
    b.forEach(function(b2) {
      var d2 = ck.bind(null, a2, b2);
      c.has(b2) || (c.add(b2), b2.then(d2, d2));
    });
  }
}
function dk(a2, b) {
  var c = b.deletions;
  if (null !== c) for (var d2 = 0; d2 < c.length; d2++) {
    var e = c[d2];
    try {
      var f2 = a2, g2 = b, h = g2;
      a: for (; null !== h; ) {
        switch (h.tag) {
          case 5:
            X = h.stateNode;
            Yj = false;
            break a;
          case 3:
            X = h.stateNode.containerInfo;
            Yj = true;
            break a;
          case 4:
            X = h.stateNode.containerInfo;
            Yj = true;
            break a;
        }
        h = h.return;
      }
      if (null === X) throw Error(p$3(160));
      ak(f2, g2, e);
      X = null;
      Yj = false;
      var k = e.alternate;
      null !== k && (k.return = null);
      e.return = null;
    } catch (l2) {
      W(e, b, l2);
    }
  }
  if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) ek(b, a2), b = b.sibling;
}
function ek(a2, b) {
  var c = a2.alternate, d2 = a2.flags;
  switch (a2.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      dk(b, a2);
      fk(a2);
      if (d2 & 4) {
        try {
          Qj(3, a2, a2.return), Rj(3, a2);
        } catch (t2) {
          W(a2, a2.return, t2);
        }
        try {
          Qj(5, a2, a2.return);
        } catch (t2) {
          W(a2, a2.return, t2);
        }
      }
      break;
    case 1:
      dk(b, a2);
      fk(a2);
      d2 & 512 && null !== c && Mj(c, c.return);
      break;
    case 5:
      dk(b, a2);
      fk(a2);
      d2 & 512 && null !== c && Mj(c, c.return);
      if (a2.flags & 32) {
        var e = a2.stateNode;
        try {
          ob(e, "");
        } catch (t2) {
          W(a2, a2.return, t2);
        }
      }
      if (d2 & 4 && (e = a2.stateNode, null != e)) {
        var f2 = a2.memoizedProps, g2 = null !== c ? c.memoizedProps : f2, h = a2.type, k = a2.updateQueue;
        a2.updateQueue = null;
        if (null !== k) try {
          "input" === h && "radio" === f2.type && null != f2.name && ab(e, f2);
          vb(h, g2);
          var l2 = vb(h, f2);
          for (g2 = 0; g2 < k.length; g2 += 2) {
            var m2 = k[g2], q2 = k[g2 + 1];
            "style" === m2 ? sb(e, q2) : "dangerouslySetInnerHTML" === m2 ? nb(e, q2) : "children" === m2 ? ob(e, q2) : ta(e, m2, q2, l2);
          }
          switch (h) {
            case "input":
              bb(e, f2);
              break;
            case "textarea":
              ib(e, f2);
              break;
            case "select":
              var r2 = e._wrapperState.wasMultiple;
              e._wrapperState.wasMultiple = !!f2.multiple;
              var y2 = f2.value;
              null != y2 ? fb(e, !!f2.multiple, y2, false) : r2 !== !!f2.multiple && (null != f2.defaultValue ? fb(
                e,
                !!f2.multiple,
                f2.defaultValue,
                true
              ) : fb(e, !!f2.multiple, f2.multiple ? [] : "", false));
          }
          e[Pf] = f2;
        } catch (t2) {
          W(a2, a2.return, t2);
        }
      }
      break;
    case 6:
      dk(b, a2);
      fk(a2);
      if (d2 & 4) {
        if (null === a2.stateNode) throw Error(p$3(162));
        e = a2.stateNode;
        f2 = a2.memoizedProps;
        try {
          e.nodeValue = f2;
        } catch (t2) {
          W(a2, a2.return, t2);
        }
      }
      break;
    case 3:
      dk(b, a2);
      fk(a2);
      if (d2 & 4 && null !== c && c.memoizedState.isDehydrated) try {
        bd(b.containerInfo);
      } catch (t2) {
        W(a2, a2.return, t2);
      }
      break;
    case 4:
      dk(b, a2);
      fk(a2);
      break;
    case 13:
      dk(b, a2);
      fk(a2);
      e = a2.child;
      e.flags & 8192 && (f2 = null !== e.memoizedState, e.stateNode.isHidden = f2, !f2 || null !== e.alternate && null !== e.alternate.memoizedState || (gk = B()));
      d2 & 4 && bk(a2);
      break;
    case 22:
      m2 = null !== c && null !== c.memoizedState;
      a2.mode & 1 ? (U = (l2 = U) || m2, dk(b, a2), U = l2) : dk(b, a2);
      fk(a2);
      if (d2 & 8192) {
        l2 = null !== a2.memoizedState;
        if ((a2.stateNode.isHidden = l2) && !m2 && 0 !== (a2.mode & 1)) for (V = a2, m2 = a2.child; null !== m2; ) {
          for (q2 = V = m2; null !== V; ) {
            r2 = V;
            y2 = r2.child;
            switch (r2.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Qj(4, r2, r2.return);
                break;
              case 1:
                Mj(r2, r2.return);
                var n2 = r2.stateNode;
                if ("function" === typeof n2.componentWillUnmount) {
                  d2 = r2;
                  c = r2.return;
                  try {
                    b = d2, n2.props = b.memoizedProps, n2.state = b.memoizedState, n2.componentWillUnmount();
                  } catch (t2) {
                    W(d2, c, t2);
                  }
                }
                break;
              case 5:
                Mj(r2, r2.return);
                break;
              case 22:
                if (null !== r2.memoizedState) {
                  hk(q2);
                  continue;
                }
            }
            null !== y2 ? (y2.return = r2, V = y2) : hk(q2);
          }
          m2 = m2.sibling;
        }
        a: for (m2 = null, q2 = a2; ; ) {
          if (5 === q2.tag) {
            if (null === m2) {
              m2 = q2;
              try {
                e = q2.stateNode, l2 ? (f2 = e.style, "function" === typeof f2.setProperty ? f2.setProperty("display", "none", "important") : f2.display = "none") : (h = q2.stateNode, k = q2.memoizedProps.style, g2 = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g2));
              } catch (t2) {
                W(a2, a2.return, t2);
              }
            }
          } else if (6 === q2.tag) {
            if (null === m2) try {
              q2.stateNode.nodeValue = l2 ? "" : q2.memoizedProps;
            } catch (t2) {
              W(a2, a2.return, t2);
            }
          } else if ((22 !== q2.tag && 23 !== q2.tag || null === q2.memoizedState || q2 === a2) && null !== q2.child) {
            q2.child.return = q2;
            q2 = q2.child;
            continue;
          }
          if (q2 === a2) break a;
          for (; null === q2.sibling; ) {
            if (null === q2.return || q2.return === a2) break a;
            m2 === q2 && (m2 = null);
            q2 = q2.return;
          }
          m2 === q2 && (m2 = null);
          q2.sibling.return = q2.return;
          q2 = q2.sibling;
        }
      }
      break;
    case 19:
      dk(b, a2);
      fk(a2);
      d2 & 4 && bk(a2);
      break;
    case 21:
      break;
    default:
      dk(
        b,
        a2
      ), fk(a2);
  }
}
function fk(a2) {
  var b = a2.flags;
  if (b & 2) {
    try {
      a: {
        for (var c = a2.return; null !== c; ) {
          if (Uj(c)) {
            var d2 = c;
            break a;
          }
          c = c.return;
        }
        throw Error(p$3(160));
      }
      switch (d2.tag) {
        case 5:
          var e = d2.stateNode;
          d2.flags & 32 && (ob(e, ""), d2.flags &= -33);
          var f2 = Vj(a2);
          Xj(a2, f2, e);
          break;
        case 3:
        case 4:
          var g2 = d2.stateNode.containerInfo, h = Vj(a2);
          Wj(a2, h, g2);
          break;
        default:
          throw Error(p$3(161));
      }
    } catch (k) {
      W(a2, a2.return, k);
    }
    a2.flags &= -3;
  }
  b & 4096 && (a2.flags &= -4097);
}
function ik(a2, b, c) {
  V = a2;
  jk(a2);
}
function jk(a2, b, c) {
  for (var d2 = 0 !== (a2.mode & 1); null !== V; ) {
    var e = V, f2 = e.child;
    if (22 === e.tag && d2) {
      var g2 = null !== e.memoizedState || Kj;
      if (!g2) {
        var h = e.alternate, k = null !== h && null !== h.memoizedState || U;
        h = Kj;
        var l2 = U;
        Kj = g2;
        if ((U = k) && !l2) for (V = e; null !== V; ) g2 = V, k = g2.child, 22 === g2.tag && null !== g2.memoizedState ? kk(e) : null !== k ? (k.return = g2, V = k) : kk(e);
        for (; null !== f2; ) V = f2, jk(f2), f2 = f2.sibling;
        V = e;
        Kj = h;
        U = l2;
      }
      lk(a2);
    } else 0 !== (e.subtreeFlags & 8772) && null !== f2 ? (f2.return = e, V = f2) : lk(a2);
  }
}
function lk(a2) {
  for (; null !== V; ) {
    var b = V;
    if (0 !== (b.flags & 8772)) {
      var c = b.alternate;
      try {
        if (0 !== (b.flags & 8772)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            U || Rj(5, b);
            break;
          case 1:
            var d2 = b.stateNode;
            if (b.flags & 4 && !U) if (null === c) d2.componentDidMount();
            else {
              var e = b.elementType === b.type ? c.memoizedProps : Lg(b.type, c.memoizedProps);
              d2.componentDidUpdate(e, c.memoizedState, d2.__reactInternalSnapshotBeforeUpdate);
            }
            var f2 = b.updateQueue;
            null !== f2 && ih(b, f2, d2);
            break;
          case 3:
            var g2 = b.updateQueue;
            if (null !== g2) {
              c = null;
              if (null !== b.child) switch (b.child.tag) {
                case 5:
                  c = b.child.stateNode;
                  break;
                case 1:
                  c = b.child.stateNode;
              }
              ih(b, g2, c);
            }
            break;
          case 5:
            var h = b.stateNode;
            if (null === c && b.flags & 4) {
              c = h;
              var k = b.memoizedProps;
              switch (b.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  k.autoFocus && c.focus();
                  break;
                case "img":
                  k.src && (c.src = k.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (null === b.memoizedState) {
              var l2 = b.alternate;
              if (null !== l2) {
                var m2 = l2.memoizedState;
                if (null !== m2) {
                  var q2 = m2.dehydrated;
                  null !== q2 && bd(q2);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(p$3(163));
        }
        U || b.flags & 512 && Sj(b);
      } catch (r2) {
        W(b, b.return, r2);
      }
    }
    if (b === a2) {
      V = null;
      break;
    }
    c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function hk(a2) {
  for (; null !== V; ) {
    var b = V;
    if (b === a2) {
      V = null;
      break;
    }
    var c = b.sibling;
    if (null !== c) {
      c.return = b.return;
      V = c;
      break;
    }
    V = b.return;
  }
}
function kk(a2) {
  for (; null !== V; ) {
    var b = V;
    try {
      switch (b.tag) {
        case 0:
        case 11:
        case 15:
          var c = b.return;
          try {
            Rj(4, b);
          } catch (k) {
            W(b, c, k);
          }
          break;
        case 1:
          var d2 = b.stateNode;
          if ("function" === typeof d2.componentDidMount) {
            var e = b.return;
            try {
              d2.componentDidMount();
            } catch (k) {
              W(b, e, k);
            }
          }
          var f2 = b.return;
          try {
            Sj(b);
          } catch (k) {
            W(b, f2, k);
          }
          break;
        case 5:
          var g2 = b.return;
          try {
            Sj(b);
          } catch (k) {
            W(b, g2, k);
          }
      }
    } catch (k) {
      W(b, b.return, k);
    }
    if (b === a2) {
      V = null;
      break;
    }
    var h = b.sibling;
    if (null !== h) {
      h.return = b.return;
      V = h;
      break;
    }
    V = b.return;
  }
}
var mk = Math.ceil, nk = ua$1.ReactCurrentDispatcher, ok = ua$1.ReactCurrentOwner, pk = ua$1.ReactCurrentBatchConfig, K = 0, R = null, Y = null, Z = 0, gj = 0, fj = Uf(0), T = 0, qk = null, hh = 0, rk = 0, sk = 0, tk = null, uk = null, gk = 0, Hj = Infinity, vk = null, Pi = false, Qi = null, Si = null, wk = false, xk = null, yk = 0, zk = 0, Ak = null, Bk = -1, Ck = 0;
function L$1() {
  return 0 !== (K & 6) ? B() : -1 !== Bk ? Bk : Bk = B();
}
function lh(a2) {
  if (0 === (a2.mode & 1)) return 1;
  if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
  if (null !== Kg.transition) return 0 === Ck && (Ck = yc()), Ck;
  a2 = C;
  if (0 !== a2) return a2;
  a2 = window.event;
  a2 = void 0 === a2 ? 16 : jd(a2.type);
  return a2;
}
function mh(a2, b, c, d2) {
  if (50 < zk) throw zk = 0, Ak = null, Error(p$3(185));
  Ac(a2, c, d2);
  if (0 === (K & 2) || a2 !== R) a2 === R && (0 === (K & 2) && (rk |= c), 4 === T && Dk(a2, Z)), Ek(a2, d2), 1 === c && 0 === K && 0 === (b.mode & 1) && (Hj = B() + 500, fg && jg());
}
function Ek(a2, b) {
  var c = a2.callbackNode;
  wc(a2, b);
  var d2 = uc(a2, a2 === R ? Z : 0);
  if (0 === d2) null !== c && bc(c), a2.callbackNode = null, a2.callbackPriority = 0;
  else if (b = d2 & -d2, a2.callbackPriority !== b) {
    null != c && bc(c);
    if (1 === b) 0 === a2.tag ? ig(Fk.bind(null, a2)) : hg(Fk.bind(null, a2)), Jf(function() {
      0 === (K & 6) && jg();
    }), c = null;
    else {
      switch (Dc(d2)) {
        case 1:
          c = fc;
          break;
        case 4:
          c = gc;
          break;
        case 16:
          c = hc;
          break;
        case 536870912:
          c = jc;
          break;
        default:
          c = hc;
      }
      c = Gk(c, Hk.bind(null, a2));
    }
    a2.callbackPriority = b;
    a2.callbackNode = c;
  }
}
function Hk(a2, b) {
  Bk = -1;
  Ck = 0;
  if (0 !== (K & 6)) throw Error(p$3(327));
  var c = a2.callbackNode;
  if (Ik() && a2.callbackNode !== c) return null;
  var d2 = uc(a2, a2 === R ? Z : 0);
  if (0 === d2) return null;
  if (0 !== (d2 & 30) || 0 !== (d2 & a2.expiredLanes) || b) b = Jk(a2, d2);
  else {
    b = d2;
    var e = K;
    K |= 2;
    var f2 = Kk();
    if (R !== a2 || Z !== b) vk = null, Hj = B() + 500, Lk(a2, b);
    do
      try {
        Mk();
        break;
      } catch (h) {
        Nk(a2, h);
      }
    while (1);
    Qg();
    nk.current = f2;
    K = e;
    null !== Y ? b = 0 : (R = null, Z = 0, b = T);
  }
  if (0 !== b) {
    2 === b && (e = xc(a2), 0 !== e && (d2 = e, b = Ok(a2, e)));
    if (1 === b) throw c = qk, Lk(a2, 0), Dk(a2, d2), Ek(a2, B()), c;
    if (6 === b) Dk(a2, d2);
    else {
      e = a2.current.alternate;
      if (0 === (d2 & 30) && !Pk(e) && (b = Jk(a2, d2), 2 === b && (f2 = xc(a2), 0 !== f2 && (d2 = f2, b = Ok(a2, f2))), 1 === b)) throw c = qk, Lk(a2, 0), Dk(a2, d2), Ek(a2, B()), c;
      a2.finishedWork = e;
      a2.finishedLanes = d2;
      switch (b) {
        case 0:
        case 1:
          throw Error(p$3(345));
        case 2:
          Qk(a2, uk, vk);
          break;
        case 3:
          Dk(a2, d2);
          if ((d2 & 130023424) === d2 && (b = gk + 500 - B(), 10 < b)) {
            if (0 !== uc(a2, 0)) break;
            e = a2.suspendedLanes;
            if ((e & d2) !== d2) {
              L$1();
              a2.pingedLanes |= a2.suspendedLanes & e;
              break;
            }
            a2.timeoutHandle = Ff(Qk.bind(null, a2, uk, vk), b);
            break;
          }
          Qk(a2, uk, vk);
          break;
        case 4:
          Dk(a2, d2);
          if ((d2 & 4194240) === d2) break;
          b = a2.eventTimes;
          for (e = -1; 0 < d2; ) {
            var g2 = 31 - oc(d2);
            f2 = 1 << g2;
            g2 = b[g2];
            g2 > e && (e = g2);
            d2 &= ~f2;
          }
          d2 = e;
          d2 = B() - d2;
          d2 = (120 > d2 ? 120 : 480 > d2 ? 480 : 1080 > d2 ? 1080 : 1920 > d2 ? 1920 : 3e3 > d2 ? 3e3 : 4320 > d2 ? 4320 : 1960 * mk(d2 / 1960)) - d2;
          if (10 < d2) {
            a2.timeoutHandle = Ff(Qk.bind(null, a2, uk, vk), d2);
            break;
          }
          Qk(a2, uk, vk);
          break;
        case 5:
          Qk(a2, uk, vk);
          break;
        default:
          throw Error(p$3(329));
      }
    }
  }
  Ek(a2, B());
  return a2.callbackNode === c ? Hk.bind(null, a2) : null;
}
function Ok(a2, b) {
  var c = tk;
  a2.current.memoizedState.isDehydrated && (Lk(a2, b).flags |= 256);
  a2 = Jk(a2, b);
  2 !== a2 && (b = uk, uk = c, null !== b && Gj(b));
  return a2;
}
function Gj(a2) {
  null === uk ? uk = a2 : uk.push.apply(uk, a2);
}
function Pk(a2) {
  for (var b = a2; ; ) {
    if (b.flags & 16384) {
      var c = b.updateQueue;
      if (null !== c && (c = c.stores, null !== c)) for (var d2 = 0; d2 < c.length; d2++) {
        var e = c[d2], f2 = e.getSnapshot;
        e = e.value;
        try {
          if (!He(f2(), e)) return false;
        } catch (g2) {
          return false;
        }
      }
    }
    c = b.child;
    if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
    else {
      if (b === a2) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a2) return true;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
  }
  return true;
}
function Dk(a2, b) {
  b &= ~sk;
  b &= ~rk;
  a2.suspendedLanes |= b;
  a2.pingedLanes &= ~b;
  for (a2 = a2.expirationTimes; 0 < b; ) {
    var c = 31 - oc(b), d2 = 1 << c;
    a2[c] = -1;
    b &= ~d2;
  }
}
function Fk(a2) {
  if (0 !== (K & 6)) throw Error(p$3(327));
  Ik();
  var b = uc(a2, 0);
  if (0 === (b & 1)) return Ek(a2, B()), null;
  var c = Jk(a2, b);
  if (0 !== a2.tag && 2 === c) {
    var d2 = xc(a2);
    0 !== d2 && (b = d2, c = Ok(a2, d2));
  }
  if (1 === c) throw c = qk, Lk(a2, 0), Dk(a2, b), Ek(a2, B()), c;
  if (6 === c) throw Error(p$3(345));
  a2.finishedWork = a2.current.alternate;
  a2.finishedLanes = b;
  Qk(a2, uk, vk);
  Ek(a2, B());
  return null;
}
function Rk(a2, b) {
  var c = K;
  K |= 1;
  try {
    return a2(b);
  } finally {
    K = c, 0 === K && (Hj = B() + 500, fg && jg());
  }
}
function Sk(a2) {
  null !== xk && 0 === xk.tag && 0 === (K & 6) && Ik();
  var b = K;
  K |= 1;
  var c = pk.transition, d2 = C;
  try {
    if (pk.transition = null, C = 1, a2) return a2();
  } finally {
    C = d2, pk.transition = c, K = b, 0 === (K & 6) && jg();
  }
}
function Ij() {
  gj = fj.current;
  E(fj);
}
function Lk(a2, b) {
  a2.finishedWork = null;
  a2.finishedLanes = 0;
  var c = a2.timeoutHandle;
  -1 !== c && (a2.timeoutHandle = -1, Gf(c));
  if (null !== Y) for (c = Y.return; null !== c; ) {
    var d2 = c;
    wg(d2);
    switch (d2.tag) {
      case 1:
        d2 = d2.type.childContextTypes;
        null !== d2 && void 0 !== d2 && $f();
        break;
      case 3:
        Jh();
        E(Wf);
        E(H);
        Oh();
        break;
      case 5:
        Lh(d2);
        break;
      case 4:
        Jh();
        break;
      case 13:
        E(M);
        break;
      case 19:
        E(M);
        break;
      case 10:
        Rg(d2.type._context);
        break;
      case 22:
      case 23:
        Ij();
    }
    c = c.return;
  }
  R = a2;
  Y = a2 = wh(a2.current, null);
  Z = gj = b;
  T = 0;
  qk = null;
  sk = rk = hh = 0;
  uk = tk = null;
  if (null !== Wg) {
    for (b = 0; b < Wg.length; b++) if (c = Wg[b], d2 = c.interleaved, null !== d2) {
      c.interleaved = null;
      var e = d2.next, f2 = c.pending;
      if (null !== f2) {
        var g2 = f2.next;
        f2.next = e;
        d2.next = g2;
      }
      c.pending = d2;
    }
    Wg = null;
  }
  return a2;
}
function Nk(a2, b) {
  do {
    var c = Y;
    try {
      Qg();
      Ph.current = ai;
      if (Sh) {
        for (var d2 = N.memoizedState; null !== d2; ) {
          var e = d2.queue;
          null !== e && (e.pending = null);
          d2 = d2.next;
        }
        Sh = false;
      }
      Rh = 0;
      P$1 = O = N = null;
      Th = false;
      Uh = 0;
      ok.current = null;
      if (null === c || null === c.return) {
        T = 1;
        qk = b;
        Y = null;
        break;
      }
      a: {
        var f2 = a2, g2 = c.return, h = c, k = b;
        b = Z;
        h.flags |= 32768;
        if (null !== k && "object" === typeof k && "function" === typeof k.then) {
          var l2 = k, m2 = h, q2 = m2.tag;
          if (0 === (m2.mode & 1) && (0 === q2 || 11 === q2 || 15 === q2)) {
            var r2 = m2.alternate;
            r2 ? (m2.updateQueue = r2.updateQueue, m2.memoizedState = r2.memoizedState, m2.lanes = r2.lanes) : (m2.updateQueue = null, m2.memoizedState = null);
          }
          var y2 = Vi(g2);
          if (null !== y2) {
            y2.flags &= -257;
            Wi(y2, g2, h, f2, b);
            y2.mode & 1 && Ti(f2, l2, b);
            b = y2;
            k = l2;
            var n2 = b.updateQueue;
            if (null === n2) {
              var t2 = /* @__PURE__ */ new Set();
              t2.add(k);
              b.updateQueue = t2;
            } else n2.add(k);
            break a;
          } else {
            if (0 === (b & 1)) {
              Ti(f2, l2, b);
              uj();
              break a;
            }
            k = Error(p$3(426));
          }
        } else if (I$2 && h.mode & 1) {
          var J2 = Vi(g2);
          if (null !== J2) {
            0 === (J2.flags & 65536) && (J2.flags |= 256);
            Wi(J2, g2, h, f2, b);
            Jg(Ki(k, h));
            break a;
          }
        }
        f2 = k = Ki(k, h);
        4 !== T && (T = 2);
        null === tk ? tk = [f2] : tk.push(f2);
        f2 = g2;
        do {
          switch (f2.tag) {
            case 3:
              f2.flags |= 65536;
              b &= -b;
              f2.lanes |= b;
              var x2 = Oi(f2, k, b);
              fh$1(f2, x2);
              break a;
            case 1:
              h = k;
              var w2 = f2.type, u2 = f2.stateNode;
              if (0 === (f2.flags & 128) && ("function" === typeof w2.getDerivedStateFromError || null !== u2 && "function" === typeof u2.componentDidCatch && (null === Si || !Si.has(u2)))) {
                f2.flags |= 65536;
                b &= -b;
                f2.lanes |= b;
                var F2 = Ri(f2, h, b);
                fh$1(f2, F2);
                break a;
              }
          }
          f2 = f2.return;
        } while (null !== f2);
      }
      Tk(c);
    } catch (na) {
      b = na;
      Y === c && null !== c && (Y = c = c.return);
      continue;
    }
    break;
  } while (1);
}
function Kk() {
  var a2 = nk.current;
  nk.current = ai;
  return null === a2 ? ai : a2;
}
function uj() {
  if (0 === T || 3 === T || 2 === T) T = 4;
  null === R || 0 === (hh & 268435455) && 0 === (rk & 268435455) || Dk(R, Z);
}
function Jk(a2, b) {
  var c = K;
  K |= 2;
  var d2 = Kk();
  if (R !== a2 || Z !== b) vk = null, Lk(a2, b);
  do
    try {
      Uk();
      break;
    } catch (e) {
      Nk(a2, e);
    }
  while (1);
  Qg();
  K = c;
  nk.current = d2;
  if (null !== Y) throw Error(p$3(261));
  R = null;
  Z = 0;
  return T;
}
function Uk() {
  for (; null !== Y; ) Vk(Y);
}
function Mk() {
  for (; null !== Y && !cc(); ) Vk(Y);
}
function Vk(a2) {
  var b = Wk(a2.alternate, a2, gj);
  a2.memoizedProps = a2.pendingProps;
  null === b ? Tk(a2) : Y = b;
  ok.current = null;
}
function Tk(a2) {
  var b = a2;
  do {
    var c = b.alternate;
    a2 = b.return;
    if (0 === (b.flags & 32768)) {
      if (c = Fj(c, b, gj), null !== c) {
        Y = c;
        return;
      }
    } else {
      c = Jj(c, b);
      if (null !== c) {
        c.flags &= 32767;
        Y = c;
        return;
      }
      if (null !== a2) a2.flags |= 32768, a2.subtreeFlags = 0, a2.deletions = null;
      else {
        T = 6;
        Y = null;
        return;
      }
    }
    b = b.sibling;
    if (null !== b) {
      Y = b;
      return;
    }
    Y = b = a2;
  } while (null !== b);
  0 === T && (T = 5);
}
function Qk(a2, b, c) {
  var d2 = C, e = pk.transition;
  try {
    pk.transition = null, C = 1, Xk(a2, b, c, d2);
  } finally {
    pk.transition = e, C = d2;
  }
  return null;
}
function Xk(a2, b, c, d2) {
  do
    Ik();
  while (null !== xk);
  if (0 !== (K & 6)) throw Error(p$3(327));
  c = a2.finishedWork;
  var e = a2.finishedLanes;
  if (null === c) return null;
  a2.finishedWork = null;
  a2.finishedLanes = 0;
  if (c === a2.current) throw Error(p$3(177));
  a2.callbackNode = null;
  a2.callbackPriority = 0;
  var f2 = c.lanes | c.childLanes;
  Bc(a2, f2);
  a2 === R && (Y = R = null, Z = 0);
  0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || wk || (wk = true, Gk(hc, function() {
    Ik();
    return null;
  }));
  f2 = 0 !== (c.flags & 15990);
  if (0 !== (c.subtreeFlags & 15990) || f2) {
    f2 = pk.transition;
    pk.transition = null;
    var g2 = C;
    C = 1;
    var h = K;
    K |= 4;
    ok.current = null;
    Pj(a2, c);
    ek(c, a2);
    Oe(Df);
    dd = !!Cf;
    Df = Cf = null;
    a2.current = c;
    ik(c);
    dc();
    K = h;
    C = g2;
    pk.transition = f2;
  } else a2.current = c;
  wk && (wk = false, xk = a2, yk = e);
  f2 = a2.pendingLanes;
  0 === f2 && (Si = null);
  mc(c.stateNode);
  Ek(a2, B());
  if (null !== b) for (d2 = a2.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d2(e.value, { componentStack: e.stack, digest: e.digest });
  if (Pi) throw Pi = false, a2 = Qi, Qi = null, a2;
  0 !== (yk & 1) && 0 !== a2.tag && Ik();
  f2 = a2.pendingLanes;
  0 !== (f2 & 1) ? a2 === Ak ? zk++ : (zk = 0, Ak = a2) : zk = 0;
  jg();
  return null;
}
function Ik() {
  if (null !== xk) {
    var a2 = Dc(yk), b = pk.transition, c = C;
    try {
      pk.transition = null;
      C = 16 > a2 ? 16 : a2;
      if (null === xk) var d2 = false;
      else {
        a2 = xk;
        xk = null;
        yk = 0;
        if (0 !== (K & 6)) throw Error(p$3(331));
        var e = K;
        K |= 4;
        for (V = a2.current; null !== V; ) {
          var f2 = V, g2 = f2.child;
          if (0 !== (V.flags & 16)) {
            var h = f2.deletions;
            if (null !== h) {
              for (var k = 0; k < h.length; k++) {
                var l2 = h[k];
                for (V = l2; null !== V; ) {
                  var m2 = V;
                  switch (m2.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Qj(8, m2, f2);
                  }
                  var q2 = m2.child;
                  if (null !== q2) q2.return = m2, V = q2;
                  else for (; null !== V; ) {
                    m2 = V;
                    var r2 = m2.sibling, y2 = m2.return;
                    Tj(m2);
                    if (m2 === l2) {
                      V = null;
                      break;
                    }
                    if (null !== r2) {
                      r2.return = y2;
                      V = r2;
                      break;
                    }
                    V = y2;
                  }
                }
              }
              var n2 = f2.alternate;
              if (null !== n2) {
                var t2 = n2.child;
                if (null !== t2) {
                  n2.child = null;
                  do {
                    var J2 = t2.sibling;
                    t2.sibling = null;
                    t2 = J2;
                  } while (null !== t2);
                }
              }
              V = f2;
            }
          }
          if (0 !== (f2.subtreeFlags & 2064) && null !== g2) g2.return = f2, V = g2;
          else b: for (; null !== V; ) {
            f2 = V;
            if (0 !== (f2.flags & 2048)) switch (f2.tag) {
              case 0:
              case 11:
              case 15:
                Qj(9, f2, f2.return);
            }
            var x2 = f2.sibling;
            if (null !== x2) {
              x2.return = f2.return;
              V = x2;
              break b;
            }
            V = f2.return;
          }
        }
        var w2 = a2.current;
        for (V = w2; null !== V; ) {
          g2 = V;
          var u2 = g2.child;
          if (0 !== (g2.subtreeFlags & 2064) && null !== u2) u2.return = g2, V = u2;
          else b: for (g2 = w2; null !== V; ) {
            h = V;
            if (0 !== (h.flags & 2048)) try {
              switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  Rj(9, h);
              }
            } catch (na) {
              W(h, h.return, na);
            }
            if (h === g2) {
              V = null;
              break b;
            }
            var F2 = h.sibling;
            if (null !== F2) {
              F2.return = h.return;
              V = F2;
              break b;
            }
            V = h.return;
          }
        }
        K = e;
        jg();
        if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
          lc.onPostCommitFiberRoot(kc, a2);
        } catch (na) {
        }
        d2 = true;
      }
      return d2;
    } finally {
      C = c, pk.transition = b;
    }
  }
  return false;
}
function Yk(a2, b, c) {
  b = Ki(c, b);
  b = Oi(a2, b, 1);
  a2 = dh(a2, b, 1);
  b = L$1();
  null !== a2 && (Ac(a2, 1, b), Ek(a2, b));
}
function W(a2, b, c) {
  if (3 === a2.tag) Yk(a2, a2, c);
  else for (; null !== b; ) {
    if (3 === b.tag) {
      Yk(b, a2, c);
      break;
    } else if (1 === b.tag) {
      var d2 = b.stateNode;
      if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d2.componentDidCatch && (null === Si || !Si.has(d2))) {
        a2 = Ki(c, a2);
        a2 = Ri(b, a2, 1);
        b = dh(b, a2, 1);
        a2 = L$1();
        null !== b && (Ac(b, 1, a2), Ek(b, a2));
        break;
      }
    }
    b = b.return;
  }
}
function Ui(a2, b, c) {
  var d2 = a2.pingCache;
  null !== d2 && d2.delete(b);
  b = L$1();
  a2.pingedLanes |= a2.suspendedLanes & c;
  R === a2 && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - gk ? Lk(a2, 0) : sk |= c);
  Ek(a2, b);
}
function Zk(a2, b) {
  0 === b && (0 === (a2.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
  var c = L$1();
  a2 = Zg(a2, b);
  null !== a2 && (Ac(a2, b, c), Ek(a2, c));
}
function vj(a2) {
  var b = a2.memoizedState, c = 0;
  null !== b && (c = b.retryLane);
  Zk(a2, c);
}
function ck(a2, b) {
  var c = 0;
  switch (a2.tag) {
    case 13:
      var d2 = a2.stateNode;
      var e = a2.memoizedState;
      null !== e && (c = e.retryLane);
      break;
    case 19:
      d2 = a2.stateNode;
      break;
    default:
      throw Error(p$3(314));
  }
  null !== d2 && d2.delete(b);
  Zk(a2, c);
}
var Wk;
Wk = function(a2, b, c) {
  if (null !== a2) if (a2.memoizedProps !== b.pendingProps || Wf.current) Ug = true;
  else {
    if (0 === (a2.lanes & c) && 0 === (b.flags & 128)) return Ug = false, zj(a2, b, c);
    Ug = 0 !== (a2.flags & 131072) ? true : false;
  }
  else Ug = false, I$2 && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
  b.lanes = 0;
  switch (b.tag) {
    case 2:
      var d2 = b.type;
      jj(a2, b);
      a2 = b.pendingProps;
      var e = Yf(b, H.current);
      Tg(b, c);
      e = Xh(null, b, d2, a2, e, c);
      var f2 = bi();
      b.flags |= 1;
      "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d2) ? (f2 = true, cg(b)) : f2 = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, ah(b), e.updater = nh, b.stateNode = e, e._reactInternals = b, rh(b, d2, a2, c), b = kj(null, b, d2, true, f2, c)) : (b.tag = 0, I$2 && f2 && vg(b), Yi(null, b, e, c), b = b.child);
      return b;
    case 16:
      d2 = b.elementType;
      a: {
        jj(a2, b);
        a2 = b.pendingProps;
        e = d2._init;
        d2 = e(d2._payload);
        b.type = d2;
        e = b.tag = $k(d2);
        a2 = Lg(d2, a2);
        switch (e) {
          case 0:
            b = dj(null, b, d2, a2, c);
            break a;
          case 1:
            b = ij(null, b, d2, a2, c);
            break a;
          case 11:
            b = Zi(null, b, d2, a2, c);
            break a;
          case 14:
            b = aj(null, b, d2, Lg(d2.type, a2), c);
            break a;
        }
        throw Error(p$3(
          306,
          d2,
          ""
        ));
      }
      return b;
    case 0:
      return d2 = b.type, e = b.pendingProps, e = b.elementType === d2 ? e : Lg(d2, e), dj(a2, b, d2, e, c);
    case 1:
      return d2 = b.type, e = b.pendingProps, e = b.elementType === d2 ? e : Lg(d2, e), ij(a2, b, d2, e, c);
    case 3:
      a: {
        lj(b);
        if (null === a2) throw Error(p$3(387));
        d2 = b.pendingProps;
        f2 = b.memoizedState;
        e = f2.element;
        bh(a2, b);
        gh(b, d2, null, c);
        var g2 = b.memoizedState;
        d2 = g2.element;
        if (f2.isDehydrated) if (f2 = { element: d2, isDehydrated: false, cache: g2.cache, pendingSuspenseBoundaries: g2.pendingSuspenseBoundaries, transitions: g2.transitions }, b.updateQueue.baseState = f2, b.memoizedState = f2, b.flags & 256) {
          e = Ki(Error(p$3(423)), b);
          b = mj(a2, b, d2, c, e);
          break a;
        } else if (d2 !== e) {
          e = Ki(Error(p$3(424)), b);
          b = mj(a2, b, d2, c, e);
          break a;
        } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I$2 = true, zg = null, c = Ch(b, null, d2, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
        else {
          Ig();
          if (d2 === e) {
            b = $i(a2, b, c);
            break a;
          }
          Yi(a2, b, d2, c);
        }
        b = b.child;
      }
      return b;
    case 5:
      return Kh(b), null === a2 && Eg(b), d2 = b.type, e = b.pendingProps, f2 = null !== a2 ? a2.memoizedProps : null, g2 = e.children, Ef(d2, e) ? g2 = null : null !== f2 && Ef(d2, f2) && (b.flags |= 32), hj(a2, b), Yi(a2, b, g2, c), b.child;
    case 6:
      return null === a2 && Eg(b), null;
    case 13:
      return pj(a2, b, c);
    case 4:
      return Ih(b, b.stateNode.containerInfo), d2 = b.pendingProps, null === a2 ? b.child = Bh(b, null, d2, c) : Yi(a2, b, d2, c), b.child;
    case 11:
      return d2 = b.type, e = b.pendingProps, e = b.elementType === d2 ? e : Lg(d2, e), Zi(a2, b, d2, e, c);
    case 7:
      return Yi(a2, b, b.pendingProps, c), b.child;
    case 8:
      return Yi(a2, b, b.pendingProps.children, c), b.child;
    case 12:
      return Yi(a2, b, b.pendingProps.children, c), b.child;
    case 10:
      a: {
        d2 = b.type._context;
        e = b.pendingProps;
        f2 = b.memoizedProps;
        g2 = e.value;
        G$1(Mg, d2._currentValue);
        d2._currentValue = g2;
        if (null !== f2) if (He(f2.value, g2)) {
          if (f2.children === e.children && !Wf.current) {
            b = $i(a2, b, c);
            break a;
          }
        } else for (f2 = b.child, null !== f2 && (f2.return = b); null !== f2; ) {
          var h = f2.dependencies;
          if (null !== h) {
            g2 = f2.child;
            for (var k = h.firstContext; null !== k; ) {
              if (k.context === d2) {
                if (1 === f2.tag) {
                  k = ch(-1, c & -c);
                  k.tag = 2;
                  var l2 = f2.updateQueue;
                  if (null !== l2) {
                    l2 = l2.shared;
                    var m2 = l2.pending;
                    null === m2 ? k.next = k : (k.next = m2.next, m2.next = k);
                    l2.pending = k;
                  }
                }
                f2.lanes |= c;
                k = f2.alternate;
                null !== k && (k.lanes |= c);
                Sg(
                  f2.return,
                  c,
                  b
                );
                h.lanes |= c;
                break;
              }
              k = k.next;
            }
          } else if (10 === f2.tag) g2 = f2.type === b.type ? null : f2.child;
          else if (18 === f2.tag) {
            g2 = f2.return;
            if (null === g2) throw Error(p$3(341));
            g2.lanes |= c;
            h = g2.alternate;
            null !== h && (h.lanes |= c);
            Sg(g2, c, b);
            g2 = f2.sibling;
          } else g2 = f2.child;
          if (null !== g2) g2.return = f2;
          else for (g2 = f2; null !== g2; ) {
            if (g2 === b) {
              g2 = null;
              break;
            }
            f2 = g2.sibling;
            if (null !== f2) {
              f2.return = g2.return;
              g2 = f2;
              break;
            }
            g2 = g2.return;
          }
          f2 = g2;
        }
        Yi(a2, b, e.children, c);
        b = b.child;
      }
      return b;
    case 9:
      return e = b.type, d2 = b.pendingProps.children, Tg(b, c), e = Vg(e), d2 = d2(e), b.flags |= 1, Yi(a2, b, d2, c), b.child;
    case 14:
      return d2 = b.type, e = Lg(d2, b.pendingProps), e = Lg(d2.type, e), aj(a2, b, d2, e, c);
    case 15:
      return cj(a2, b, b.type, b.pendingProps, c);
    case 17:
      return d2 = b.type, e = b.pendingProps, e = b.elementType === d2 ? e : Lg(d2, e), jj(a2, b), b.tag = 1, Zf(d2) ? (a2 = true, cg(b)) : a2 = false, Tg(b, c), ph(b, d2, e), rh(b, d2, e, c), kj(null, b, d2, true, a2, c);
    case 19:
      return yj(a2, b, c);
    case 22:
      return ej(a2, b, c);
  }
  throw Error(p$3(156, b.tag));
};
function Gk(a2, b) {
  return ac(a2, b);
}
function al(a2, b, c, d2) {
  this.tag = a2;
  this.key = c;
  this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
  this.index = 0;
  this.ref = null;
  this.pendingProps = b;
  this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
  this.mode = d2;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function Bg(a2, b, c, d2) {
  return new al(a2, b, c, d2);
}
function bj(a2) {
  a2 = a2.prototype;
  return !(!a2 || !a2.isReactComponent);
}
function $k(a2) {
  if ("function" === typeof a2) return bj(a2) ? 1 : 0;
  if (void 0 !== a2 && null !== a2) {
    a2 = a2.$$typeof;
    if (a2 === Da) return 11;
    if (a2 === Ga) return 14;
  }
  return 2;
}
function wh(a2, b) {
  var c = a2.alternate;
  null === c ? (c = Bg(a2.tag, b, a2.key, a2.mode), c.elementType = a2.elementType, c.type = a2.type, c.stateNode = a2.stateNode, c.alternate = a2, a2.alternate = c) : (c.pendingProps = b, c.type = a2.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
  c.flags = a2.flags & 14680064;
  c.childLanes = a2.childLanes;
  c.lanes = a2.lanes;
  c.child = a2.child;
  c.memoizedProps = a2.memoizedProps;
  c.memoizedState = a2.memoizedState;
  c.updateQueue = a2.updateQueue;
  b = a2.dependencies;
  c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
  c.sibling = a2.sibling;
  c.index = a2.index;
  c.ref = a2.ref;
  return c;
}
function yh(a2, b, c, d2, e, f2) {
  var g2 = 2;
  d2 = a2;
  if ("function" === typeof a2) bj(a2) && (g2 = 1);
  else if ("string" === typeof a2) g2 = 5;
  else a: switch (a2) {
    case ya:
      return Ah(c.children, e, f2, b);
    case za:
      g2 = 8;
      e |= 8;
      break;
    case Aa:
      return a2 = Bg(12, c, b, e | 2), a2.elementType = Aa, a2.lanes = f2, a2;
    case Ea:
      return a2 = Bg(13, c, b, e), a2.elementType = Ea, a2.lanes = f2, a2;
    case Fa:
      return a2 = Bg(19, c, b, e), a2.elementType = Fa, a2.lanes = f2, a2;
    case Ia$1:
      return qj(c, e, f2, b);
    default:
      if ("object" === typeof a2 && null !== a2) switch (a2.$$typeof) {
        case Ba:
          g2 = 10;
          break a;
        case Ca:
          g2 = 9;
          break a;
        case Da:
          g2 = 11;
          break a;
        case Ga:
          g2 = 14;
          break a;
        case Ha:
          g2 = 16;
          d2 = null;
          break a;
      }
      throw Error(p$3(130, null == a2 ? a2 : typeof a2, ""));
  }
  b = Bg(g2, c, b, e);
  b.elementType = a2;
  b.type = d2;
  b.lanes = f2;
  return b;
}
function Ah(a2, b, c, d2) {
  a2 = Bg(7, a2, d2, b);
  a2.lanes = c;
  return a2;
}
function qj(a2, b, c, d2) {
  a2 = Bg(22, a2, d2, b);
  a2.elementType = Ia$1;
  a2.lanes = c;
  a2.stateNode = { isHidden: false };
  return a2;
}
function xh(a2, b, c) {
  a2 = Bg(6, a2, null, b);
  a2.lanes = c;
  return a2;
}
function zh(a2, b, c) {
  b = Bg(4, null !== a2.children ? a2.children : [], a2.key, b);
  b.lanes = c;
  b.stateNode = { containerInfo: a2.containerInfo, pendingChildren: null, implementation: a2.implementation };
  return b;
}
function bl(a2, b, c, d2, e) {
  this.tag = b;
  this.containerInfo = a2;
  this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = zc(0);
  this.expirationTimes = zc(-1);
  this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
  this.entanglements = zc(0);
  this.identifierPrefix = d2;
  this.onRecoverableError = e;
  this.mutableSourceEagerHydrationData = null;
}
function cl(a2, b, c, d2, e, f2, g2, h, k) {
  a2 = new bl(a2, b, c, h, k);
  1 === b ? (b = 1, true === f2 && (b |= 8)) : b = 0;
  f2 = Bg(3, null, null, b);
  a2.current = f2;
  f2.stateNode = a2;
  f2.memoizedState = { element: d2, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
  ah(f2);
  return a2;
}
function dl(a2, b, c) {
  var d2 = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return { $$typeof: wa$1, key: null == d2 ? null : "" + d2, children: a2, containerInfo: b, implementation: c };
}
function el(a2) {
  if (!a2) return Vf;
  a2 = a2._reactInternals;
  a: {
    if (Vb(a2) !== a2 || 1 !== a2.tag) throw Error(p$3(170));
    var b = a2;
    do {
      switch (b.tag) {
        case 3:
          b = b.stateNode.context;
          break a;
        case 1:
          if (Zf(b.type)) {
            b = b.stateNode.__reactInternalMemoizedMergedChildContext;
            break a;
          }
      }
      b = b.return;
    } while (null !== b);
    throw Error(p$3(171));
  }
  if (1 === a2.tag) {
    var c = a2.type;
    if (Zf(c)) return bg(a2, c, b);
  }
  return b;
}
function fl(a2, b, c, d2, e, f2, g2, h, k) {
  a2 = cl(c, d2, true, a2, e, f2, g2, h, k);
  a2.context = el(null);
  c = a2.current;
  d2 = L$1();
  e = lh(c);
  f2 = ch(d2, e);
  f2.callback = void 0 !== b && null !== b ? b : null;
  dh(c, f2, e);
  a2.current.lanes = e;
  Ac(a2, e, d2);
  Ek(a2, d2);
  return a2;
}
function gl(a2, b, c, d2) {
  var e = b.current, f2 = L$1(), g2 = lh(e);
  c = el(c);
  null === b.context ? b.context = c : b.pendingContext = c;
  b = ch(f2, g2);
  b.payload = { element: a2 };
  d2 = void 0 === d2 ? null : d2;
  null !== d2 && (b.callback = d2);
  a2 = dh(e, b, g2);
  null !== a2 && (mh(a2, e, g2, f2), eh(a2, e, g2));
  return g2;
}
function hl(a2) {
  a2 = a2.current;
  if (!a2.child) return null;
  switch (a2.child.tag) {
    case 5:
      return a2.child.stateNode;
    default:
      return a2.child.stateNode;
  }
}
function il(a2, b) {
  a2 = a2.memoizedState;
  if (null !== a2 && null !== a2.dehydrated) {
    var c = a2.retryLane;
    a2.retryLane = 0 !== c && c < b ? c : b;
  }
}
function jl(a2, b) {
  il(a2, b);
  (a2 = a2.alternate) && il(a2, b);
}
function kl() {
  return null;
}
var ll = "function" === typeof reportError ? reportError : function(a2) {
  console.error(a2);
};
function ml(a2) {
  this._internalRoot = a2;
}
nl.prototype.render = ml.prototype.render = function(a2) {
  var b = this._internalRoot;
  if (null === b) throw Error(p$3(409));
  gl(a2, b, null, null);
};
nl.prototype.unmount = ml.prototype.unmount = function() {
  var a2 = this._internalRoot;
  if (null !== a2) {
    this._internalRoot = null;
    var b = a2.containerInfo;
    Sk(function() {
      gl(null, a2, null, null);
    });
    b[uf] = null;
  }
};
function nl(a2) {
  this._internalRoot = a2;
}
nl.prototype.unstable_scheduleHydration = function(a2) {
  if (a2) {
    var b = Hc();
    a2 = { blockedOn: null, target: a2, priority: b };
    for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
    Qc.splice(c, 0, a2);
    0 === c && Vc(a2);
  }
};
function ol(a2) {
  return !(!a2 || 1 !== a2.nodeType && 9 !== a2.nodeType && 11 !== a2.nodeType);
}
function pl(a2) {
  return !(!a2 || 1 !== a2.nodeType && 9 !== a2.nodeType && 11 !== a2.nodeType && (8 !== a2.nodeType || " react-mount-point-unstable " !== a2.nodeValue));
}
function ql() {
}
function rl(a2, b, c, d2, e) {
  if (e) {
    if ("function" === typeof d2) {
      var f2 = d2;
      d2 = function() {
        var a3 = hl(g2);
        f2.call(a3);
      };
    }
    var g2 = fl(b, d2, a2, 0, null, false, false, "", ql);
    a2._reactRootContainer = g2;
    a2[uf] = g2.current;
    sf(8 === a2.nodeType ? a2.parentNode : a2);
    Sk();
    return g2;
  }
  for (; e = a2.lastChild; ) a2.removeChild(e);
  if ("function" === typeof d2) {
    var h = d2;
    d2 = function() {
      var a3 = hl(k);
      h.call(a3);
    };
  }
  var k = cl(a2, 0, false, null, null, false, false, "", ql);
  a2._reactRootContainer = k;
  a2[uf] = k.current;
  sf(8 === a2.nodeType ? a2.parentNode : a2);
  Sk(function() {
    gl(b, k, c, d2);
  });
  return k;
}
function sl(a2, b, c, d2, e) {
  var f2 = c._reactRootContainer;
  if (f2) {
    var g2 = f2;
    if ("function" === typeof e) {
      var h = e;
      e = function() {
        var a3 = hl(g2);
        h.call(a3);
      };
    }
    gl(b, g2, a2, e);
  } else g2 = rl(c, b, a2, e, d2);
  return hl(g2);
}
Ec = function(a2) {
  switch (a2.tag) {
    case 3:
      var b = a2.stateNode;
      if (b.current.memoizedState.isDehydrated) {
        var c = tc(b.pendingLanes);
        0 !== c && (Cc(b, c | 1), Ek(b, B()), 0 === (K & 6) && (Hj = B() + 500, jg()));
      }
      break;
    case 13:
      Sk(function() {
        var b2 = Zg(a2, 1);
        if (null !== b2) {
          var c2 = L$1();
          mh(b2, a2, 1, c2);
        }
      }), jl(a2, 1);
  }
};
Fc = function(a2) {
  if (13 === a2.tag) {
    var b = Zg(a2, 134217728);
    if (null !== b) {
      var c = L$1();
      mh(b, a2, 134217728, c);
    }
    jl(a2, 134217728);
  }
};
Gc = function(a2) {
  if (13 === a2.tag) {
    var b = lh(a2), c = Zg(a2, b);
    if (null !== c) {
      var d2 = L$1();
      mh(c, a2, b, d2);
    }
    jl(a2, b);
  }
};
Hc = function() {
  return C;
};
Ic = function(a2, b) {
  var c = C;
  try {
    return C = a2, b();
  } finally {
    C = c;
  }
};
yb = function(a2, b, c) {
  switch (b) {
    case "input":
      bb(a2, c);
      b = c.name;
      if ("radio" === c.type && null != b) {
        for (c = a2; c.parentNode; ) c = c.parentNode;
        c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
        for (b = 0; b < c.length; b++) {
          var d2 = c[b];
          if (d2 !== a2 && d2.form === a2.form) {
            var e = Db(d2);
            if (!e) throw Error(p$3(90));
            Wa(d2);
            bb(d2, e);
          }
        }
      }
      break;
    case "textarea":
      ib(a2, c);
      break;
    case "select":
      b = c.value, null != b && fb(a2, !!c.multiple, b, false);
  }
};
Gb = Rk;
Hb = Sk;
var tl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Rk] }, ul = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.2.0", rendererPackageName: "react-dom" };
var vl = { bundleType: ul.bundleType, version: ul.version, rendererPackageName: ul.rendererPackageName, rendererConfig: ul.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua$1.ReactCurrentDispatcher, findHostInstanceByFiber: function(a2) {
  a2 = Zb(a2);
  return null === a2 ? null : a2.stateNode;
}, findFiberByHostInstance: ul.findFiberByHostInstance || kl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.2.0-next-9e3b772b8-20220608" };
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var wl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!wl.isDisabled && wl.supportsFiber) try {
    kc = wl.inject(vl), lc = wl;
  } catch (a2) {
  }
}
reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = tl;
reactDom_production_min.createPortal = function(a2, b) {
  var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!ol(b)) throw Error(p$3(200));
  return dl(a2, b, null, c);
};
reactDom_production_min.createRoot = function(a2, b) {
  if (!ol(a2)) throw Error(p$3(299));
  var c = false, d2 = "", e = ll;
  null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d2 = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
  b = cl(a2, 1, false, null, null, c, false, d2, e);
  a2[uf] = b.current;
  sf(8 === a2.nodeType ? a2.parentNode : a2);
  return new ml(b);
};
reactDom_production_min.findDOMNode = function(a2) {
  if (null == a2) return null;
  if (1 === a2.nodeType) return a2;
  var b = a2._reactInternals;
  if (void 0 === b) {
    if ("function" === typeof a2.render) throw Error(p$3(188));
    a2 = Object.keys(a2).join(",");
    throw Error(p$3(268, a2));
  }
  a2 = Zb(b);
  a2 = null === a2 ? null : a2.stateNode;
  return a2;
};
reactDom_production_min.flushSync = function(a2) {
  return Sk(a2);
};
reactDom_production_min.hydrate = function(a2, b, c) {
  if (!pl(b)) throw Error(p$3(200));
  return sl(null, a2, b, true, c);
};
reactDom_production_min.hydrateRoot = function(a2, b, c) {
  if (!ol(a2)) throw Error(p$3(405));
  var d2 = null != c && c.hydratedSources || null, e = false, f2 = "", g2 = ll;
  null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f2 = c.identifierPrefix), void 0 !== c.onRecoverableError && (g2 = c.onRecoverableError));
  b = fl(b, null, a2, 1, null != c ? c : null, e, false, f2, g2);
  a2[uf] = b.current;
  sf(a2);
  if (d2) for (a2 = 0; a2 < d2.length; a2++) c = d2[a2], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
    c,
    e
  );
  return new nl(b);
};
reactDom_production_min.render = function(a2, b, c) {
  if (!pl(b)) throw Error(p$3(200));
  return sl(null, a2, b, false, c);
};
reactDom_production_min.unmountComponentAtNode = function(a2) {
  if (!pl(a2)) throw Error(p$3(40));
  return a2._reactRootContainer ? (Sk(function() {
    sl(null, null, a2, false, function() {
      a2._reactRootContainer = null;
      a2[uf] = null;
    });
  }), true) : false;
};
reactDom_production_min.unstable_batchedUpdates = Rk;
reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a2, b, c, d2) {
  if (!pl(c)) throw Error(p$3(200));
  if (null == a2 || void 0 === a2._reactInternals) throw Error(p$3(38));
  return sl(a2, b, c, false, d2);
};
reactDom_production_min.version = "18.2.0-next-9e3b772b8-20220608";
function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}
var reactDomExports = reactDom.exports;
const $5e63c961fc1ce211$export$8c6ed5c666ac1360$2 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const childrenArray = reactExports.Children.toArray(children);
  const slottable = childrenArray.find($5e63c961fc1ce211$var$isSlottable$2);
  if (slottable) {
    const newElement = slottable.props.children;
    const newChildren = childrenArray.map((child) => {
      if (child === slottable) {
        if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
        return /* @__PURE__ */ reactExports.isValidElement(newElement) ? newElement.props.children : null;
      } else return child;
    });
    return /* @__PURE__ */ reactExports.createElement($5e63c961fc1ce211$var$SlotClone$2, _extends$2({}, slotProps, {
      ref: forwardedRef
    }), /* @__PURE__ */ reactExports.isValidElement(newElement) ? /* @__PURE__ */ reactExports.cloneElement(newElement, void 0, newChildren) : null);
  }
  return /* @__PURE__ */ reactExports.createElement($5e63c961fc1ce211$var$SlotClone$2, _extends$2({}, slotProps, {
    ref: forwardedRef
  }), children);
});
$5e63c961fc1ce211$export$8c6ed5c666ac1360$2.displayName = "Slot";
const $5e63c961fc1ce211$var$SlotClone$2 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  if (/* @__PURE__ */ reactExports.isValidElement(children)) return /* @__PURE__ */ reactExports.cloneElement(children, {
    ...$5e63c961fc1ce211$var$mergeProps$2(slotProps, children.props),
    ref: forwardedRef ? $6ed0406888f73fc4$export$43e446d32b3d21af$2(forwardedRef, children.ref) : children.ref
  });
  return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
});
$5e63c961fc1ce211$var$SlotClone$2.displayName = "SlotClone";
const $5e63c961fc1ce211$export$d9f1ccf0bdb05d45$2 = ({ children }) => {
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, children);
};
function $5e63c961fc1ce211$var$isSlottable$2(child) {
  return /* @__PURE__ */ reactExports.isValidElement(child) && child.type === $5e63c961fc1ce211$export$d9f1ccf0bdb05d45$2;
}
function $5e63c961fc1ce211$var$mergeProps$2(slotProps, childProps) {
  const overrideProps = {
    ...childProps
  };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) overrideProps[propName] = (...args) => {
        childPropValue(...args);
        slotPropValue(...args);
      };
      else if (slotPropValue) overrideProps[propName] = slotPropValue;
    } else if (propName === "style") overrideProps[propName] = {
      ...slotPropValue,
      ...childPropValue
    };
    else if (propName === "className") overrideProps[propName] = [
      slotPropValue,
      childPropValue
    ].filter(Boolean).join(" ");
  }
  return {
    ...slotProps,
    ...overrideProps
  };
}
const $8927f6f2acc4f386$var$NODES$2 = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "span",
  "svg",
  "ul"
];
const $8927f6f2acc4f386$export$250ffa63cdc0d034$2 = $8927f6f2acc4f386$var$NODES$2.reduce((primitive, node) => {
  const Node2 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? $5e63c961fc1ce211$export$8c6ed5c666ac1360$2 : node;
    reactExports.useEffect(() => {
      window[Symbol.for("radix-ui")] = true;
    }, []);
    return /* @__PURE__ */ reactExports.createElement(Comp, _extends$2({}, primitiveProps, {
      ref: forwardedRef
    }));
  });
  Node2.displayName = `Primitive.${node}`;
  return {
    ...primitive,
    [node]: Node2
  };
}, {});
function r$2(e) {
  var t2, f2, n2 = "";
  if ("string" == typeof e || "number" == typeof e) n2 += e;
  else if ("object" == typeof e) if (Array.isArray(e)) for (t2 = 0; t2 < e.length; t2++) e[t2] && (f2 = r$2(e[t2])) && (n2 && (n2 += " "), n2 += f2);
  else for (t2 in e) e[t2] && (n2 && (n2 += " "), n2 += t2);
  return n2;
}
function clsx() {
  for (var e, t2, f2 = 0, n2 = ""; f2 < arguments.length; ) (e = arguments[f2++]) && (t2 = r$2(e)) && (n2 && (n2 += " "), n2 += t2);
  return n2;
}
const $b73a6c6685e72184$export$b04be29aa201d4f5$1 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  return /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034$2.label, _extends$2({}, props, {
    ref: forwardedRef,
    onMouseDown: (event) => {
      var _props$onMouseDown;
      (_props$onMouseDown = props.onMouseDown) === null || _props$onMouseDown === void 0 || _props$onMouseDown.call(props, event);
      if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
    }
  }));
});
const label$2 = "K4qlZ";
const error$3 = "-pD14";
const Label$1 = reactExports.forwardRef(
  ({ children, className, error: error$12 = false, ...props }, ref) => {
    return /* @__PURE__ */ reactExports.createElement(
      $b73a6c6685e72184$export$b04be29aa201d4f5$1,
      {
        ref,
        className: clsx(label$2, { [error$3]: error$12 }, className),
        ...props
      },
      children
    );
  }
);
Label$1.displayName = "Label";
/*!
 * Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
 * Copyright 2024 Fonticons, Inc.
 */
function _defineProperty$1(e, r2, t2) {
  return (r2 = _toPropertyKey$1(r2)) in e ? Object.defineProperty(e, r2, {
    value: t2,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r2] = t2, e;
}
function ownKeys$1(e, r2) {
  var t2 = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o2 = Object.getOwnPropertySymbols(e);
    r2 && (o2 = o2.filter(function(r3) {
      return Object.getOwnPropertyDescriptor(e, r3).enumerable;
    })), t2.push.apply(t2, o2);
  }
  return t2;
}
function _objectSpread2$1(e) {
  for (var r2 = 1; r2 < arguments.length; r2++) {
    var t2 = null != arguments[r2] ? arguments[r2] : {};
    r2 % 2 ? ownKeys$1(Object(t2), true).forEach(function(r3) {
      _defineProperty$1(e, r3, t2[r3]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t2)) : ownKeys$1(Object(t2)).forEach(function(r3) {
      Object.defineProperty(e, r3, Object.getOwnPropertyDescriptor(t2, r3));
    });
  }
  return e;
}
function _toPrimitive$1(t2, r2) {
  if ("object" != typeof t2 || !t2) return t2;
  var e = t2[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i2 = e.call(t2, r2);
    if ("object" != typeof i2) return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r2 ? String : Number)(t2);
}
function _toPropertyKey$1(t2) {
  var i2 = _toPrimitive$1(t2, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
const noop = () => {
};
let _WINDOW = {};
let _DOCUMENT = {};
let _MUTATION_OBSERVER = null;
let _PERFORMANCE = {
  mark: noop,
  measure: noop
};
try {
  if (typeof window !== "undefined") _WINDOW = window;
  if (typeof document !== "undefined") _DOCUMENT = document;
  if (typeof MutationObserver !== "undefined") _MUTATION_OBSERVER = MutationObserver;
  if (typeof performance !== "undefined") _PERFORMANCE = performance;
} catch (e) {
}
const {
  userAgent = ""
} = _WINDOW.navigator || {};
const WINDOW = _WINDOW;
const DOCUMENT = _DOCUMENT;
const MUTATION_OBSERVER = _MUTATION_OBSERVER;
const PERFORMANCE = _PERFORMANCE;
!!WINDOW.document;
const IS_DOM = !!DOCUMENT.documentElement && !!DOCUMENT.head && typeof DOCUMENT.addEventListener === "function" && typeof DOCUMENT.createElement === "function";
const IS_IE = ~userAgent.indexOf("MSIE") || ~userAgent.indexOf("Trident/");
var p$2 = /fa(s|r|l|t|d|dr|dl|dt|b|k|kd|ss|sr|sl|st|sds|sdr|sdl|sdt)?[\-\ ]/, g = /Font ?Awesome ?([56 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit)?.*/i;
var S = {
  classic: {
    fa: "solid",
    fas: "solid",
    "fa-solid": "solid",
    far: "regular",
    "fa-regular": "regular",
    fal: "light",
    "fa-light": "light",
    fat: "thin",
    "fa-thin": "thin",
    fab: "brands",
    "fa-brands": "brands"
  },
  duotone: {
    fa: "solid",
    fad: "solid",
    "fa-solid": "solid",
    "fa-duotone": "solid",
    fadr: "regular",
    "fa-regular": "regular",
    fadl: "light",
    "fa-light": "light",
    fadt: "thin",
    "fa-thin": "thin"
  },
  sharp: {
    fa: "solid",
    fass: "solid",
    "fa-solid": "solid",
    fasr: "regular",
    "fa-regular": "regular",
    fasl: "light",
    "fa-light": "light",
    fast: "thin",
    "fa-thin": "thin"
  },
  "sharp-duotone": {
    fa: "solid",
    fasds: "solid",
    "fa-solid": "solid",
    fasdr: "regular",
    "fa-regular": "regular",
    fasdl: "light",
    "fa-light": "light",
    fasdt: "thin",
    "fa-thin": "thin"
  }
}, A = {
  GROUP: "duotone-group",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, P = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"];
var s$2 = "classic", t = "duotone", r = "sharp", o = "sharp-duotone", L = [s$2, t, r, o];
var G = {
  classic: {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  duotone: {
    900: "fad",
    400: "fadr",
    300: "fadl",
    100: "fadt"
  },
  sharp: {
    900: "fass",
    400: "fasr",
    300: "fasl",
    100: "fast"
  },
  "sharp-duotone": {
    900: "fasds",
    400: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
};
var lt = {
  "Font Awesome 6 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 6 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal",
    100: "fat"
  },
  "Font Awesome 6 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 6 Duotone": {
    900: "fad",
    400: "fadr",
    normal: "fadr",
    300: "fadl",
    100: "fadt"
  },
  "Font Awesome 6 Sharp": {
    900: "fass",
    400: "fasr",
    normal: "fasr",
    300: "fasl",
    100: "fast"
  },
  "Font Awesome 6 Sharp Duotone": {
    900: "fasds",
    400: "fasdr",
    normal: "fasdr",
    300: "fasdl",
    100: "fasdt"
  }
};
var pt = /* @__PURE__ */ new Map([["classic", {
  defaultShortPrefixId: "fas",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin", "brands"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp", {
  defaultShortPrefixId: "fass",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["duotone", {
  defaultShortPrefixId: "fad",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}], ["sharp-duotone", {
  defaultShortPrefixId: "fasds",
  defaultStyleId: "solid",
  styleIds: ["solid", "regular", "light", "thin"],
  futureStyleIds: [],
  defaultFontWeight: 900
}]]), xt = {
  classic: {
    solid: "fas",
    regular: "far",
    light: "fal",
    thin: "fat",
    brands: "fab"
  },
  duotone: {
    solid: "fad",
    regular: "fadr",
    light: "fadl",
    thin: "fadt"
  },
  sharp: {
    solid: "fass",
    regular: "fasr",
    light: "fasl",
    thin: "fast"
  },
  "sharp-duotone": {
    solid: "fasds",
    regular: "fasdr",
    light: "fasdl",
    thin: "fasdt"
  }
};
var Ft = ["fak", "fa-kit", "fakd", "fa-kit-duotone"], St = {
  kit: {
    fak: "kit",
    "fa-kit": "kit"
  },
  "kit-duotone": {
    fakd: "kit-duotone",
    "fa-kit-duotone": "kit-duotone"
  }
}, At = ["kit"];
var Ct = {
  kit: {
    "fa-kit": "fak"
  }
};
var Lt = ["fak", "fakd"], Wt = {
  kit: {
    fak: "fa-kit"
  }
};
var Et = {
  kit: {
    kit: "fak"
  },
  "kit-duotone": {
    "kit-duotone": "fakd"
  }
};
var t$1 = {
  GROUP: "duotone-group",
  SWAP_OPACITY: "swap-opacity",
  PRIMARY: "primary",
  SECONDARY: "secondary"
}, r$1 = ["fa-classic", "fa-duotone", "fa-sharp", "fa-sharp-duotone"];
var bt$1 = ["fak", "fa-kit", "fakd", "fa-kit-duotone"];
var Yt = {
  "Font Awesome Kit": {
    400: "fak",
    normal: "fak"
  },
  "Font Awesome Kit Duotone": {
    400: "fakd",
    normal: "fakd"
  }
};
var ua = {
  classic: {
    "fa-brands": "fab",
    "fa-duotone": "fad",
    "fa-light": "fal",
    "fa-regular": "far",
    "fa-solid": "fas",
    "fa-thin": "fat"
  },
  duotone: {
    "fa-regular": "fadr",
    "fa-light": "fadl",
    "fa-thin": "fadt"
  },
  sharp: {
    "fa-solid": "fass",
    "fa-regular": "fasr",
    "fa-light": "fasl",
    "fa-thin": "fast"
  },
  "sharp-duotone": {
    "fa-solid": "fasds",
    "fa-regular": "fasdr",
    "fa-light": "fasdl",
    "fa-thin": "fasdt"
  }
}, I$1$1 = {
  classic: ["fas", "far", "fal", "fat", "fad"],
  duotone: ["fadr", "fadl", "fadt"],
  sharp: ["fass", "fasr", "fasl", "fast"],
  "sharp-duotone": ["fasds", "fasdr", "fasdl", "fasdt"]
}, ga = {
  classic: {
    fab: "fa-brands",
    fad: "fa-duotone",
    fal: "fa-light",
    far: "fa-regular",
    fas: "fa-solid",
    fat: "fa-thin"
  },
  duotone: {
    fadr: "fa-regular",
    fadl: "fa-light",
    fadt: "fa-thin"
  },
  sharp: {
    fass: "fa-solid",
    fasr: "fa-regular",
    fasl: "fa-light",
    fast: "fa-thin"
  },
  "sharp-duotone": {
    fasds: "fa-solid",
    fasdr: "fa-regular",
    fasdl: "fa-light",
    fasdt: "fa-thin"
  }
}, x = ["fa-solid", "fa-regular", "fa-light", "fa-thin", "fa-duotone", "fa-brands"], Ia = ["fa", "fas", "far", "fal", "fat", "fad", "fadr", "fadl", "fadt", "fab", "fass", "fasr", "fasl", "fast", "fasds", "fasdr", "fasdl", "fasdt", ...r$1, ...x], m$1$1 = ["solid", "regular", "light", "thin", "duotone", "brands"], c$1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], F$1 = c$1.concat([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), ma = [...Object.keys(I$1$1), ...m$1$1, "2xs", "xs", "sm", "lg", "xl", "2xl", "beat", "border", "fade", "beat-fade", "bounce", "flip-both", "flip-horizontal", "flip-vertical", "flip", "fw", "inverse", "layers-counter", "layers-text", "layers", "li", "pull-left", "pull-right", "pulse", "rotate-180", "rotate-270", "rotate-90", "rotate-by", "shake", "spin-pulse", "spin-reverse", "spin", "stack-1x", "stack-2x", "stack", "ul", t$1.GROUP, t$1.SWAP_OPACITY, t$1.PRIMARY, t$1.SECONDARY].concat(c$1.map((a2) => "".concat(a2, "x"))).concat(F$1.map((a2) => "w-".concat(a2)));
var wa = {
  "Font Awesome 5 Free": {
    900: "fas",
    400: "far"
  },
  "Font Awesome 5 Pro": {
    900: "fas",
    400: "far",
    normal: "far",
    300: "fal"
  },
  "Font Awesome 5 Brands": {
    400: "fab",
    normal: "fab"
  },
  "Font Awesome 5 Duotone": {
    900: "fad"
  }
};
const NAMESPACE_IDENTIFIER = "___FONT_AWESOME___";
const UNITS_IN_GRID = 16;
const DEFAULT_CSS_PREFIX = "fa";
const DEFAULT_REPLACEMENT_CLASS = "svg-inline--fa";
const DATA_FA_I2SVG = "data-fa-i2svg";
const DATA_FA_PSEUDO_ELEMENT = "data-fa-pseudo-element";
const DATA_FA_PSEUDO_ELEMENT_PENDING = "data-fa-pseudo-element-pending";
const DATA_PREFIX = "data-prefix";
const DATA_ICON = "data-icon";
const HTML_CLASS_I2SVG_BASE_CLASS = "fontawesome-i2svg";
const MUTATION_APPROACH_ASYNC = "async";
const TAGNAMES_TO_SKIP_FOR_PSEUDOELEMENTS = ["HTML", "HEAD", "STYLE", "SCRIPT"];
const PRODUCTION$1 = (() => {
  try {
    return true;
  } catch (e$$1) {
    return false;
  }
})();
function familyProxy(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      return prop in target ? target[prop] : target[s$2];
    }
  });
}
const _PREFIX_TO_STYLE = _objectSpread2$1({}, S);
_PREFIX_TO_STYLE[s$2] = _objectSpread2$1(_objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, {
  "fa-duotone": "duotone"
}), S[s$2]), St["kit"]), St["kit-duotone"]);
const PREFIX_TO_STYLE = familyProxy(_PREFIX_TO_STYLE);
const _STYLE_TO_PREFIX = _objectSpread2$1({}, xt);
_STYLE_TO_PREFIX[s$2] = _objectSpread2$1(_objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, {
  duotone: "fad"
}), _STYLE_TO_PREFIX[s$2]), Et["kit"]), Et["kit-duotone"]);
const STYLE_TO_PREFIX = familyProxy(_STYLE_TO_PREFIX);
const _PREFIX_TO_LONG_STYLE = _objectSpread2$1({}, ga);
_PREFIX_TO_LONG_STYLE[s$2] = _objectSpread2$1(_objectSpread2$1({}, _PREFIX_TO_LONG_STYLE[s$2]), Wt["kit"]);
const PREFIX_TO_LONG_STYLE = familyProxy(_PREFIX_TO_LONG_STYLE);
const _LONG_STYLE_TO_PREFIX = _objectSpread2$1({}, ua);
_LONG_STYLE_TO_PREFIX[s$2] = _objectSpread2$1(_objectSpread2$1({}, _LONG_STYLE_TO_PREFIX[s$2]), Ct["kit"]);
familyProxy(_LONG_STYLE_TO_PREFIX);
const ICON_SELECTION_SYNTAX_PATTERN = p$2;
const LAYERS_TEXT_CLASSNAME = "fa-layers-text";
const FONT_FAMILY_PATTERN = g;
const _FONT_WEIGHT_TO_PREFIX = _objectSpread2$1({}, G);
familyProxy(_FONT_WEIGHT_TO_PREFIX);
const ATTRIBUTES_WATCHED_FOR_MUTATION = ["class", "data-prefix", "data-icon", "data-fa-transform", "data-fa-mask"];
const DUOTONE_CLASSES = A;
const RESERVED_CLASSES = [...At, ...ma];
const initial = WINDOW.FontAwesomeConfig || {};
function getAttrConfig(attr) {
  var element = DOCUMENT.querySelector("script[" + attr + "]");
  if (element) {
    return element.getAttribute(attr);
  }
}
function coerce(val) {
  if (val === "") return true;
  if (val === "false") return false;
  if (val === "true") return true;
  return val;
}
if (DOCUMENT && typeof DOCUMENT.querySelector === "function") {
  const attrs = [["data-family-prefix", "familyPrefix"], ["data-css-prefix", "cssPrefix"], ["data-family-default", "familyDefault"], ["data-style-default", "styleDefault"], ["data-replacement-class", "replacementClass"], ["data-auto-replace-svg", "autoReplaceSvg"], ["data-auto-add-css", "autoAddCss"], ["data-auto-a11y", "autoA11y"], ["data-search-pseudo-elements", "searchPseudoElements"], ["data-observe-mutations", "observeMutations"], ["data-mutate-approach", "mutateApproach"], ["data-keep-original-source", "keepOriginalSource"], ["data-measure-performance", "measurePerformance"], ["data-show-missing-icons", "showMissingIcons"]];
  attrs.forEach((_ref) => {
    let [attr, key] = _ref;
    const val = coerce(getAttrConfig(attr));
    if (val !== void 0 && val !== null) {
      initial[key] = val;
    }
  });
}
const _default = {
  styleDefault: "solid",
  familyDefault: s$2,
  cssPrefix: DEFAULT_CSS_PREFIX,
  replacementClass: DEFAULT_REPLACEMENT_CLASS,
  autoReplaceSvg: true,
  autoAddCss: true,
  autoA11y: true,
  searchPseudoElements: false,
  observeMutations: true,
  mutateApproach: "async",
  keepOriginalSource: true,
  measurePerformance: false,
  showMissingIcons: true
};
if (initial.familyPrefix) {
  initial.cssPrefix = initial.familyPrefix;
}
const _config = _objectSpread2$1(_objectSpread2$1({}, _default), initial);
if (!_config.autoReplaceSvg) _config.observeMutations = false;
const config = {};
Object.keys(_default).forEach((key) => {
  Object.defineProperty(config, key, {
    enumerable: true,
    set: function(val) {
      _config[key] = val;
      _onChangeCb.forEach((cb2) => cb2(config));
    },
    get: function() {
      return _config[key];
    }
  });
});
Object.defineProperty(config, "familyPrefix", {
  enumerable: true,
  set: function(val) {
    _config.cssPrefix = val;
    _onChangeCb.forEach((cb2) => cb2(config));
  },
  get: function() {
    return _config.cssPrefix;
  }
});
WINDOW.FontAwesomeConfig = config;
const _onChangeCb = [];
function onChange(cb2) {
  _onChangeCb.push(cb2);
  return () => {
    _onChangeCb.splice(_onChangeCb.indexOf(cb2), 1);
  };
}
const d$2 = UNITS_IN_GRID;
const meaninglessTransform = {
  size: 16,
  x: 0,
  y: 0,
  rotate: 0,
  flipX: false,
  flipY: false
};
function insertCss(css2) {
  if (!css2 || !IS_DOM) {
    return;
  }
  const style = DOCUMENT.createElement("style");
  style.setAttribute("type", "text/css");
  style.innerHTML = css2;
  const headChildren = DOCUMENT.head.childNodes;
  let beforeChild = null;
  for (let i2 = headChildren.length - 1; i2 > -1; i2--) {
    const child = headChildren[i2];
    const tagName = (child.tagName || "").toUpperCase();
    if (["STYLE", "LINK"].indexOf(tagName) > -1) {
      beforeChild = child;
    }
  }
  DOCUMENT.head.insertBefore(style, beforeChild);
  return css2;
}
const idPool = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function nextUniqueId() {
  let size = 12;
  let id2 = "";
  while (size-- > 0) {
    id2 += idPool[Math.random() * 62 | 0];
  }
  return id2;
}
function toArray(obj) {
  const array = [];
  for (let i2 = (obj || []).length >>> 0; i2--; ) {
    array[i2] = obj[i2];
  }
  return array;
}
function classArray(node) {
  if (node.classList) {
    return toArray(node.classList);
  } else {
    return (node.getAttribute("class") || "").split(" ").filter((i2) => i2);
  }
}
function htmlEscape(str) {
  return "".concat(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function joinAttributes(attributes) {
  return Object.keys(attributes || {}).reduce((acc, attributeName) => {
    return acc + "".concat(attributeName, '="').concat(htmlEscape(attributes[attributeName]), '" ');
  }, "").trim();
}
function joinStyles(styles2) {
  return Object.keys(styles2 || {}).reduce((acc, styleName) => {
    return acc + "".concat(styleName, ": ").concat(styles2[styleName].trim(), ";");
  }, "");
}
function transformIsMeaningful(transform) {
  return transform.size !== meaninglessTransform.size || transform.x !== meaninglessTransform.x || transform.y !== meaninglessTransform.y || transform.rotate !== meaninglessTransform.rotate || transform.flipX || transform.flipY;
}
function transformForSvg(_ref) {
  let {
    transform,
    containerWidth,
    iconWidth
  } = _ref;
  const outer = {
    transform: "translate(".concat(containerWidth / 2, " 256)")
  };
  const innerTranslate = "translate(".concat(transform.x * 32, ", ").concat(transform.y * 32, ") ");
  const innerScale = "scale(".concat(transform.size / 16 * (transform.flipX ? -1 : 1), ", ").concat(transform.size / 16 * (transform.flipY ? -1 : 1), ") ");
  const innerRotate = "rotate(".concat(transform.rotate, " 0 0)");
  const inner = {
    transform: "".concat(innerTranslate, " ").concat(innerScale, " ").concat(innerRotate)
  };
  const path = {
    transform: "translate(".concat(iconWidth / 2 * -1, " -256)")
  };
  return {
    outer,
    inner,
    path
  };
}
function transformForCss(_ref2) {
  let {
    transform,
    width = UNITS_IN_GRID,
    height = UNITS_IN_GRID,
    startCentered = false
  } = _ref2;
  let val = "";
  if (startCentered && IS_IE) {
    val += "translate(".concat(transform.x / d$2 - width / 2, "em, ").concat(transform.y / d$2 - height / 2, "em) ");
  } else if (startCentered) {
    val += "translate(calc(-50% + ".concat(transform.x / d$2, "em), calc(-50% + ").concat(transform.y / d$2, "em)) ");
  } else {
    val += "translate(".concat(transform.x / d$2, "em, ").concat(transform.y / d$2, "em) ");
  }
  val += "scale(".concat(transform.size / d$2 * (transform.flipX ? -1 : 1), ", ").concat(transform.size / d$2 * (transform.flipY ? -1 : 1), ") ");
  val += "rotate(".concat(transform.rotate, "deg) ");
  return val;
}
var baseStyles = ':root, :host {\n  --fa-font-solid: normal 900 1em/1 "Font Awesome 6 Free";\n  --fa-font-regular: normal 400 1em/1 "Font Awesome 6 Free";\n  --fa-font-light: normal 300 1em/1 "Font Awesome 6 Pro";\n  --fa-font-thin: normal 100 1em/1 "Font Awesome 6 Pro";\n  --fa-font-duotone: normal 900 1em/1 "Font Awesome 6 Duotone";\n  --fa-font-duotone-regular: normal 400 1em/1 "Font Awesome 6 Duotone";\n  --fa-font-duotone-light: normal 300 1em/1 "Font Awesome 6 Duotone";\n  --fa-font-duotone-thin: normal 100 1em/1 "Font Awesome 6 Duotone";\n  --fa-font-brands: normal 400 1em/1 "Font Awesome 6 Brands";\n  --fa-font-sharp-solid: normal 900 1em/1 "Font Awesome 6 Sharp";\n  --fa-font-sharp-regular: normal 400 1em/1 "Font Awesome 6 Sharp";\n  --fa-font-sharp-light: normal 300 1em/1 "Font Awesome 6 Sharp";\n  --fa-font-sharp-thin: normal 100 1em/1 "Font Awesome 6 Sharp";\n  --fa-font-sharp-duotone-solid: normal 900 1em/1 "Font Awesome 6 Sharp Duotone";\n  --fa-font-sharp-duotone-regular: normal 400 1em/1 "Font Awesome 6 Sharp Duotone";\n  --fa-font-sharp-duotone-light: normal 300 1em/1 "Font Awesome 6 Sharp Duotone";\n  --fa-font-sharp-duotone-thin: normal 100 1em/1 "Font Awesome 6 Sharp Duotone";\n}\n\nsvg:not(:root).svg-inline--fa, svg:not(:host).svg-inline--fa {\n  overflow: visible;\n  box-sizing: content-box;\n}\n\n.svg-inline--fa {\n  display: var(--fa-display, inline-block);\n  height: 1em;\n  overflow: visible;\n  vertical-align: -0.125em;\n}\n.svg-inline--fa.fa-2xs {\n  vertical-align: 0.1em;\n}\n.svg-inline--fa.fa-xs {\n  vertical-align: 0em;\n}\n.svg-inline--fa.fa-sm {\n  vertical-align: -0.0714285705em;\n}\n.svg-inline--fa.fa-lg {\n  vertical-align: -0.2em;\n}\n.svg-inline--fa.fa-xl {\n  vertical-align: -0.25em;\n}\n.svg-inline--fa.fa-2xl {\n  vertical-align: -0.3125em;\n}\n.svg-inline--fa.fa-pull-left {\n  margin-right: var(--fa-pull-margin, 0.3em);\n  width: auto;\n}\n.svg-inline--fa.fa-pull-right {\n  margin-left: var(--fa-pull-margin, 0.3em);\n  width: auto;\n}\n.svg-inline--fa.fa-li {\n  width: var(--fa-li-width, 2em);\n  top: 0.25em;\n}\n.svg-inline--fa.fa-fw {\n  width: var(--fa-fw-width, 1.25em);\n}\n\n.fa-layers svg.svg-inline--fa {\n  bottom: 0;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n\n.fa-layers-counter, .fa-layers-text {\n  display: inline-block;\n  position: absolute;\n  text-align: center;\n}\n\n.fa-layers {\n  display: inline-block;\n  height: 1em;\n  position: relative;\n  text-align: center;\n  vertical-align: -0.125em;\n  width: 1em;\n}\n.fa-layers svg.svg-inline--fa {\n  transform-origin: center center;\n}\n\n.fa-layers-text {\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  transform-origin: center center;\n}\n\n.fa-layers-counter {\n  background-color: var(--fa-counter-background-color, #ff253a);\n  border-radius: var(--fa-counter-border-radius, 1em);\n  box-sizing: border-box;\n  color: var(--fa-inverse, #fff);\n  line-height: var(--fa-counter-line-height, 1);\n  max-width: var(--fa-counter-max-width, 5em);\n  min-width: var(--fa-counter-min-width, 1.5em);\n  overflow: hidden;\n  padding: var(--fa-counter-padding, 0.25em 0.5em);\n  right: var(--fa-right, 0);\n  text-overflow: ellipsis;\n  top: var(--fa-top, 0);\n  transform: scale(var(--fa-counter-scale, 0.25));\n  transform-origin: top right;\n}\n\n.fa-layers-bottom-right {\n  bottom: var(--fa-bottom, 0);\n  right: var(--fa-right, 0);\n  top: auto;\n  transform: scale(var(--fa-layers-scale, 0.25));\n  transform-origin: bottom right;\n}\n\n.fa-layers-bottom-left {\n  bottom: var(--fa-bottom, 0);\n  left: var(--fa-left, 0);\n  right: auto;\n  top: auto;\n  transform: scale(var(--fa-layers-scale, 0.25));\n  transform-origin: bottom left;\n}\n\n.fa-layers-top-right {\n  top: var(--fa-top, 0);\n  right: var(--fa-right, 0);\n  transform: scale(var(--fa-layers-scale, 0.25));\n  transform-origin: top right;\n}\n\n.fa-layers-top-left {\n  left: var(--fa-left, 0);\n  right: auto;\n  top: var(--fa-top, 0);\n  transform: scale(var(--fa-layers-scale, 0.25));\n  transform-origin: top left;\n}\n\n.fa-1x {\n  font-size: 1em;\n}\n\n.fa-2x {\n  font-size: 2em;\n}\n\n.fa-3x {\n  font-size: 3em;\n}\n\n.fa-4x {\n  font-size: 4em;\n}\n\n.fa-5x {\n  font-size: 5em;\n}\n\n.fa-6x {\n  font-size: 6em;\n}\n\n.fa-7x {\n  font-size: 7em;\n}\n\n.fa-8x {\n  font-size: 8em;\n}\n\n.fa-9x {\n  font-size: 9em;\n}\n\n.fa-10x {\n  font-size: 10em;\n}\n\n.fa-2xs {\n  font-size: 0.625em;\n  line-height: 0.1em;\n  vertical-align: 0.225em;\n}\n\n.fa-xs {\n  font-size: 0.75em;\n  line-height: 0.0833333337em;\n  vertical-align: 0.125em;\n}\n\n.fa-sm {\n  font-size: 0.875em;\n  line-height: 0.0714285718em;\n  vertical-align: 0.0535714295em;\n}\n\n.fa-lg {\n  font-size: 1.25em;\n  line-height: 0.05em;\n  vertical-align: -0.075em;\n}\n\n.fa-xl {\n  font-size: 1.5em;\n  line-height: 0.0416666682em;\n  vertical-align: -0.125em;\n}\n\n.fa-2xl {\n  font-size: 2em;\n  line-height: 0.03125em;\n  vertical-align: -0.1875em;\n}\n\n.fa-fw {\n  text-align: center;\n  width: 1.25em;\n}\n\n.fa-ul {\n  list-style-type: none;\n  margin-left: var(--fa-li-margin, 2.5em);\n  padding-left: 0;\n}\n.fa-ul > li {\n  position: relative;\n}\n\n.fa-li {\n  left: calc(-1 * var(--fa-li-width, 2em));\n  position: absolute;\n  text-align: center;\n  width: var(--fa-li-width, 2em);\n  line-height: inherit;\n}\n\n.fa-border {\n  border-color: var(--fa-border-color, #eee);\n  border-radius: var(--fa-border-radius, 0.1em);\n  border-style: var(--fa-border-style, solid);\n  border-width: var(--fa-border-width, 0.08em);\n  padding: var(--fa-border-padding, 0.2em 0.25em 0.15em);\n}\n\n.fa-pull-left {\n  float: left;\n  margin-right: var(--fa-pull-margin, 0.3em);\n}\n\n.fa-pull-right {\n  float: right;\n  margin-left: var(--fa-pull-margin, 0.3em);\n}\n\n.fa-beat {\n  animation-name: fa-beat;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n}\n\n.fa-bounce {\n  animation-name: fa-bounce;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));\n}\n\n.fa-fade {\n  animation-name: fa-fade;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));\n}\n\n.fa-beat-fade {\n  animation-name: fa-beat-fade;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.4, 0, 0.6, 1));\n}\n\n.fa-flip {\n  animation-name: fa-flip;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, ease-in-out);\n}\n\n.fa-shake {\n  animation-name: fa-shake;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, linear);\n}\n\n.fa-spin {\n  animation-name: fa-spin;\n  animation-delay: var(--fa-animation-delay, 0s);\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 2s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, linear);\n}\n\n.fa-spin-reverse {\n  --fa-animation-direction: reverse;\n}\n\n.fa-pulse,\n.fa-spin-pulse {\n  animation-name: fa-spin;\n  animation-direction: var(--fa-animation-direction, normal);\n  animation-duration: var(--fa-animation-duration, 1s);\n  animation-iteration-count: var(--fa-animation-iteration-count, infinite);\n  animation-timing-function: var(--fa-animation-timing, steps(8));\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .fa-beat,\n.fa-bounce,\n.fa-fade,\n.fa-beat-fade,\n.fa-flip,\n.fa-pulse,\n.fa-shake,\n.fa-spin,\n.fa-spin-pulse {\n    animation-delay: -1ms;\n    animation-duration: 1ms;\n    animation-iteration-count: 1;\n    transition-delay: 0s;\n    transition-duration: 0s;\n  }\n}\n@keyframes fa-beat {\n  0%, 90% {\n    transform: scale(1);\n  }\n  45% {\n    transform: scale(var(--fa-beat-scale, 1.25));\n  }\n}\n@keyframes fa-bounce {\n  0% {\n    transform: scale(1, 1) translateY(0);\n  }\n  10% {\n    transform: scale(var(--fa-bounce-start-scale-x, 1.1), var(--fa-bounce-start-scale-y, 0.9)) translateY(0);\n  }\n  30% {\n    transform: scale(var(--fa-bounce-jump-scale-x, 0.9), var(--fa-bounce-jump-scale-y, 1.1)) translateY(var(--fa-bounce-height, -0.5em));\n  }\n  50% {\n    transform: scale(var(--fa-bounce-land-scale-x, 1.05), var(--fa-bounce-land-scale-y, 0.95)) translateY(0);\n  }\n  57% {\n    transform: scale(1, 1) translateY(var(--fa-bounce-rebound, -0.125em));\n  }\n  64% {\n    transform: scale(1, 1) translateY(0);\n  }\n  100% {\n    transform: scale(1, 1) translateY(0);\n  }\n}\n@keyframes fa-fade {\n  50% {\n    opacity: var(--fa-fade-opacity, 0.4);\n  }\n}\n@keyframes fa-beat-fade {\n  0%, 100% {\n    opacity: var(--fa-beat-fade-opacity, 0.4);\n    transform: scale(1);\n  }\n  50% {\n    opacity: 1;\n    transform: scale(var(--fa-beat-fade-scale, 1.125));\n  }\n}\n@keyframes fa-flip {\n  50% {\n    transform: rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -180deg));\n  }\n}\n@keyframes fa-shake {\n  0% {\n    transform: rotate(-15deg);\n  }\n  4% {\n    transform: rotate(15deg);\n  }\n  8%, 24% {\n    transform: rotate(-18deg);\n  }\n  12%, 28% {\n    transform: rotate(18deg);\n  }\n  16% {\n    transform: rotate(-22deg);\n  }\n  20% {\n    transform: rotate(22deg);\n  }\n  32% {\n    transform: rotate(-12deg);\n  }\n  36% {\n    transform: rotate(12deg);\n  }\n  40%, 100% {\n    transform: rotate(0deg);\n  }\n}\n@keyframes fa-spin {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n.fa-rotate-90 {\n  transform: rotate(90deg);\n}\n\n.fa-rotate-180 {\n  transform: rotate(180deg);\n}\n\n.fa-rotate-270 {\n  transform: rotate(270deg);\n}\n\n.fa-flip-horizontal {\n  transform: scale(-1, 1);\n}\n\n.fa-flip-vertical {\n  transform: scale(1, -1);\n}\n\n.fa-flip-both,\n.fa-flip-horizontal.fa-flip-vertical {\n  transform: scale(-1, -1);\n}\n\n.fa-rotate-by {\n  transform: rotate(var(--fa-rotate-angle, 0));\n}\n\n.fa-stack {\n  display: inline-block;\n  vertical-align: middle;\n  height: 2em;\n  position: relative;\n  width: 2.5em;\n}\n\n.fa-stack-1x,\n.fa-stack-2x {\n  bottom: 0;\n  left: 0;\n  margin: auto;\n  position: absolute;\n  right: 0;\n  top: 0;\n  z-index: var(--fa-stack-z-index, auto);\n}\n\n.svg-inline--fa.fa-stack-1x {\n  height: 1em;\n  width: 1.25em;\n}\n.svg-inline--fa.fa-stack-2x {\n  height: 2em;\n  width: 2.5em;\n}\n\n.fa-inverse {\n  color: var(--fa-inverse, #fff);\n}\n\n.sr-only,\n.fa-sr-only {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border-width: 0;\n}\n\n.sr-only-focusable:not(:focus),\n.fa-sr-only-focusable:not(:focus) {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  padding: 0;\n  margin: -1px;\n  overflow: hidden;\n  clip: rect(0, 0, 0, 0);\n  white-space: nowrap;\n  border-width: 0;\n}\n\n.svg-inline--fa .fa-primary {\n  fill: var(--fa-primary-color, currentColor);\n  opacity: var(--fa-primary-opacity, 1);\n}\n\n.svg-inline--fa .fa-secondary {\n  fill: var(--fa-secondary-color, currentColor);\n  opacity: var(--fa-secondary-opacity, 0.4);\n}\n\n.svg-inline--fa.fa-swap-opacity .fa-primary {\n  opacity: var(--fa-secondary-opacity, 0.4);\n}\n\n.svg-inline--fa.fa-swap-opacity .fa-secondary {\n  opacity: var(--fa-primary-opacity, 1);\n}\n\n.svg-inline--fa mask .fa-primary,\n.svg-inline--fa mask .fa-secondary {\n  fill: black;\n}';
function css() {
  const dcp = DEFAULT_CSS_PREFIX;
  const drc = DEFAULT_REPLACEMENT_CLASS;
  const fp = config.cssPrefix;
  const rc2 = config.replacementClass;
  let s2 = baseStyles;
  if (fp !== dcp || rc2 !== drc) {
    const dPatt = new RegExp("\\.".concat(dcp, "\\-"), "g");
    const customPropPatt = new RegExp("\\--".concat(dcp, "\\-"), "g");
    const rPatt = new RegExp("\\.".concat(drc), "g");
    s2 = s2.replace(dPatt, ".".concat(fp, "-")).replace(customPropPatt, "--".concat(fp, "-")).replace(rPatt, ".".concat(rc2));
  }
  return s2;
}
let _cssInserted = false;
function ensureCss() {
  if (config.autoAddCss && !_cssInserted) {
    insertCss(css());
    _cssInserted = true;
  }
}
var InjectCSS = {
  mixout() {
    return {
      dom: {
        css,
        insertCss: ensureCss
      }
    };
  },
  hooks() {
    return {
      beforeDOMElementCreation() {
        ensureCss();
      },
      beforeI2svg() {
        ensureCss();
      }
    };
  }
};
const w = WINDOW || {};
if (!w[NAMESPACE_IDENTIFIER]) w[NAMESPACE_IDENTIFIER] = {};
if (!w[NAMESPACE_IDENTIFIER].styles) w[NAMESPACE_IDENTIFIER].styles = {};
if (!w[NAMESPACE_IDENTIFIER].hooks) w[NAMESPACE_IDENTIFIER].hooks = {};
if (!w[NAMESPACE_IDENTIFIER].shims) w[NAMESPACE_IDENTIFIER].shims = [];
var namespace = w[NAMESPACE_IDENTIFIER];
const functions = [];
const listener = function() {
  DOCUMENT.removeEventListener("DOMContentLoaded", listener);
  loaded = 1;
  functions.map((fn) => fn());
};
let loaded = false;
if (IS_DOM) {
  loaded = (DOCUMENT.documentElement.doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(DOCUMENT.readyState);
  if (!loaded) DOCUMENT.addEventListener("DOMContentLoaded", listener);
}
function domready(fn) {
  if (!IS_DOM) return;
  loaded ? setTimeout(fn, 0) : functions.push(fn);
}
function toHtml(abstractNodes) {
  const {
    tag,
    attributes = {},
    children = []
  } = abstractNodes;
  if (typeof abstractNodes === "string") {
    return htmlEscape(abstractNodes);
  } else {
    return "<".concat(tag, " ").concat(joinAttributes(attributes), ">").concat(children.map(toHtml).join(""), "</").concat(tag, ">");
  }
}
function iconFromMapping(mapping, prefix, iconName) {
  if (mapping && mapping[prefix] && mapping[prefix][iconName]) {
    return {
      prefix,
      iconName,
      icon: mapping[prefix][iconName]
    };
  }
}
var reduce = function fastReduceObject(subject, fn, initialValue, thisContext) {
  var keys = Object.keys(subject), length = keys.length, iterator = fn, i2, key, result;
  if (initialValue === void 0) {
    i2 = 1;
    result = subject[keys[0]];
  } else {
    i2 = 0;
    result = initialValue;
  }
  for (; i2 < length; i2++) {
    key = keys[i2];
    result = iterator(result, subject[key], key, subject);
  }
  return result;
};
function ucs2decode(string) {
  const output = [];
  let counter2 = 0;
  const length = string.length;
  while (counter2 < length) {
    const value = string.charCodeAt(counter2++);
    if (value >= 55296 && value <= 56319 && counter2 < length) {
      const extra = string.charCodeAt(counter2++);
      if ((extra & 64512) == 56320) {
        output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
      } else {
        output.push(value);
        counter2--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
}
function toHex(unicode) {
  const decoded = ucs2decode(unicode);
  return decoded.length === 1 ? decoded[0].toString(16) : null;
}
function codePointAt(string, index) {
  const size = string.length;
  let first = string.charCodeAt(index);
  let second;
  if (first >= 55296 && first <= 56319 && size > index + 1) {
    second = string.charCodeAt(index + 1);
    if (second >= 56320 && second <= 57343) {
      return (first - 55296) * 1024 + second - 56320 + 65536;
    }
  }
  return first;
}
function normalizeIcons(icons) {
  return Object.keys(icons).reduce((acc, iconName) => {
    const icon2 = icons[iconName];
    const expanded = !!icon2.icon;
    if (expanded) {
      acc[icon2.iconName] = icon2.icon;
    } else {
      acc[iconName] = icon2;
    }
    return acc;
  }, {});
}
function defineIcons(prefix, icons) {
  let params = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const {
    skipHooks = false
  } = params;
  const normalized = normalizeIcons(icons);
  if (typeof namespace.hooks.addPack === "function" && !skipHooks) {
    namespace.hooks.addPack(prefix, normalizeIcons(icons));
  } else {
    namespace.styles[prefix] = _objectSpread2$1(_objectSpread2$1({}, namespace.styles[prefix] || {}), normalized);
  }
  if (prefix === "fas") {
    defineIcons("fa", icons);
  }
}
const {
  styles: styles$1,
  shims
} = namespace;
const FAMILY_NAMES = Object.keys(PREFIX_TO_LONG_STYLE);
const PREFIXES_FOR_FAMILY = FAMILY_NAMES.reduce((acc, familyId) => {
  acc[familyId] = Object.keys(PREFIX_TO_LONG_STYLE[familyId]);
  return acc;
}, {});
let _defaultUsablePrefix = null;
let _byUnicode = {};
let _byLigature = {};
let _byOldName = {};
let _byOldUnicode = {};
let _byAlias = {};
function isReserved(name) {
  return ~RESERVED_CLASSES.indexOf(name);
}
function getIconName(cssPrefix, cls) {
  const parts = cls.split("-");
  const prefix = parts[0];
  const iconName = parts.slice(1).join("-");
  if (prefix === cssPrefix && iconName !== "" && !isReserved(iconName)) {
    return iconName;
  } else {
    return null;
  }
}
const build = () => {
  const lookup = (reducer) => {
    return reduce(styles$1, (o$$1, style, prefix) => {
      o$$1[prefix] = reduce(style, reducer, {});
      return o$$1;
    }, {});
  };
  _byUnicode = lookup((acc, icon2, iconName) => {
    if (icon2[3]) {
      acc[icon2[3]] = iconName;
    }
    if (icon2[2]) {
      const aliases = icon2[2].filter((a$$1) => {
        return typeof a$$1 === "number";
      });
      aliases.forEach((alias) => {
        acc[alias.toString(16)] = iconName;
      });
    }
    return acc;
  });
  _byLigature = lookup((acc, icon2, iconName) => {
    acc[iconName] = iconName;
    if (icon2[2]) {
      const aliases = icon2[2].filter((a$$1) => {
        return typeof a$$1 === "string";
      });
      aliases.forEach((alias) => {
        acc[alias] = iconName;
      });
    }
    return acc;
  });
  _byAlias = lookup((acc, icon2, iconName) => {
    const aliases = icon2[2];
    acc[iconName] = iconName;
    aliases.forEach((alias) => {
      acc[alias] = iconName;
    });
    return acc;
  });
  const hasRegular = "far" in styles$1 || config.autoFetchSvg;
  const shimLookups = reduce(shims, (acc, shim) => {
    const maybeNameMaybeUnicode = shim[0];
    let prefix = shim[1];
    const iconName = shim[2];
    if (prefix === "far" && !hasRegular) {
      prefix = "fas";
    }
    if (typeof maybeNameMaybeUnicode === "string") {
      acc.names[maybeNameMaybeUnicode] = {
        prefix,
        iconName
      };
    }
    if (typeof maybeNameMaybeUnicode === "number") {
      acc.unicodes[maybeNameMaybeUnicode.toString(16)] = {
        prefix,
        iconName
      };
    }
    return acc;
  }, {
    names: {},
    unicodes: {}
  });
  _byOldName = shimLookups.names;
  _byOldUnicode = shimLookups.unicodes;
  _defaultUsablePrefix = getCanonicalPrefix(config.styleDefault, {
    family: config.familyDefault
  });
};
onChange((c$$1) => {
  _defaultUsablePrefix = getCanonicalPrefix(c$$1.styleDefault, {
    family: config.familyDefault
  });
});
build();
function byUnicode(prefix, unicode) {
  return (_byUnicode[prefix] || {})[unicode];
}
function byLigature(prefix, ligature) {
  return (_byLigature[prefix] || {})[ligature];
}
function byAlias(prefix, alias) {
  return (_byAlias[prefix] || {})[alias];
}
function byOldName(name) {
  return _byOldName[name] || {
    prefix: null,
    iconName: null
  };
}
function byOldUnicode(unicode) {
  const oldUnicode = _byOldUnicode[unicode];
  const newUnicode = byUnicode("fas", unicode);
  return oldUnicode || (newUnicode ? {
    prefix: "fas",
    iconName: newUnicode
  } : null) || {
    prefix: null,
    iconName: null
  };
}
function getDefaultUsablePrefix() {
  return _defaultUsablePrefix;
}
const emptyCanonicalIcon = () => {
  return {
    prefix: null,
    iconName: null,
    rest: []
  };
};
function getFamilyId(values) {
  let family = s$2;
  const famProps = FAMILY_NAMES.reduce((acc, familyId) => {
    acc[familyId] = "".concat(config.cssPrefix, "-").concat(familyId);
    return acc;
  }, {});
  L.forEach((familyId) => {
    if (values.includes(famProps[familyId]) || values.some((v$$1) => PREFIXES_FOR_FAMILY[familyId].includes(v$$1))) {
      family = familyId;
    }
  });
  return family;
}
function getCanonicalPrefix(styleOrPrefix) {
  let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    family = s$2
  } = params;
  const style = PREFIX_TO_STYLE[family][styleOrPrefix];
  if (family === t && !styleOrPrefix) {
    return "fad";
  }
  const prefix = STYLE_TO_PREFIX[family][styleOrPrefix] || STYLE_TO_PREFIX[family][style];
  const defined = styleOrPrefix in namespace.styles ? styleOrPrefix : null;
  const result = prefix || defined || null;
  return result;
}
function moveNonFaClassesToRest(classNames) {
  let rest = [];
  let iconName = null;
  classNames.forEach((cls) => {
    const result = getIconName(config.cssPrefix, cls);
    if (result) {
      iconName = result;
    } else if (cls) {
      rest.push(cls);
    }
  });
  return {
    iconName,
    rest
  };
}
function sortedUniqueValues(arr) {
  return arr.sort().filter((value, index, arr2) => {
    return arr2.indexOf(value) === index;
  });
}
function getCanonicalIcon(values) {
  let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    skipLookups = false
  } = params;
  let givenPrefix = null;
  const faCombinedClasses = Ia.concat(bt$1);
  const faStyleOrFamilyClasses = sortedUniqueValues(values.filter((cls) => faCombinedClasses.includes(cls)));
  const nonStyleOrFamilyClasses = sortedUniqueValues(values.filter((cls) => !Ia.includes(cls)));
  const faStyles = faStyleOrFamilyClasses.filter((cls) => {
    givenPrefix = cls;
    return !P.includes(cls);
  });
  const [styleFromValues = null] = faStyles;
  const family = getFamilyId(faStyleOrFamilyClasses);
  const canonical = _objectSpread2$1(_objectSpread2$1({}, moveNonFaClassesToRest(nonStyleOrFamilyClasses)), {}, {
    prefix: getCanonicalPrefix(styleFromValues, {
      family
    })
  });
  return _objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, canonical), getDefaultCanonicalPrefix({
    values,
    family,
    styles: styles$1,
    config,
    canonical,
    givenPrefix
  })), applyShimAndAlias(skipLookups, givenPrefix, canonical));
}
function applyShimAndAlias(skipLookups, givenPrefix, canonical) {
  let {
    prefix,
    iconName
  } = canonical;
  if (skipLookups || !prefix || !iconName) {
    return {
      prefix,
      iconName
    };
  }
  const shim = givenPrefix === "fa" ? byOldName(iconName) : {};
  const aliasIconName = byAlias(prefix, iconName);
  iconName = shim.iconName || aliasIconName || iconName;
  prefix = shim.prefix || prefix;
  if (prefix === "far" && !styles$1["far"] && styles$1["fas"] && !config.autoFetchSvg) {
    prefix = "fas";
  }
  return {
    prefix,
    iconName
  };
}
const newCanonicalFamilies = L.filter((familyId) => {
  return familyId !== s$2 || familyId !== t;
});
const newCanonicalStyles = Object.keys(ga).filter((key) => key !== s$2).map((key) => Object.keys(ga[key])).flat();
function getDefaultCanonicalPrefix(prefixOptions) {
  const {
    values,
    family,
    canonical,
    givenPrefix = "",
    styles: styles2 = {},
    config: config$$1 = {}
  } = prefixOptions;
  const isDuotoneFamily = family === t;
  const valuesHasDuotone = values.includes("fa-duotone") || values.includes("fad");
  const defaultFamilyIsDuotone = config$$1.familyDefault === "duotone";
  const canonicalPrefixIsDuotone = canonical.prefix === "fad" || canonical.prefix === "fa-duotone";
  if (!isDuotoneFamily && (valuesHasDuotone || defaultFamilyIsDuotone || canonicalPrefixIsDuotone)) {
    canonical.prefix = "fad";
  }
  if (values.includes("fa-brands") || values.includes("fab")) {
    canonical.prefix = "fab";
  }
  if (!canonical.prefix && newCanonicalFamilies.includes(family)) {
    const validPrefix = Object.keys(styles2).find((key) => newCanonicalStyles.includes(key));
    if (validPrefix || config$$1.autoFetchSvg) {
      const defaultPrefix = pt.get(family).defaultShortPrefixId;
      canonical.prefix = defaultPrefix;
      canonical.iconName = byAlias(canonical.prefix, canonical.iconName) || canonical.iconName;
    }
  }
  if (canonical.prefix === "fa" || givenPrefix === "fa") {
    canonical.prefix = getDefaultUsablePrefix() || "fas";
  }
  return canonical;
}
class Library {
  constructor() {
    this.definitions = {};
  }
  add() {
    for (var _len = arguments.length, definitions = new Array(_len), _key = 0; _key < _len; _key++) {
      definitions[_key] = arguments[_key];
    }
    const additions = definitions.reduce(this._pullDefinitions, {});
    Object.keys(additions).forEach((key) => {
      this.definitions[key] = _objectSpread2$1(_objectSpread2$1({}, this.definitions[key] || {}), additions[key]);
      defineIcons(key, additions[key]);
      const longPrefix = PREFIX_TO_LONG_STYLE[s$2][key];
      if (longPrefix) defineIcons(longPrefix, additions[key]);
      build();
    });
  }
  reset() {
    this.definitions = {};
  }
  _pullDefinitions(additions, definition) {
    const normalized = definition.prefix && definition.iconName && definition.icon ? {
      0: definition
    } : definition;
    Object.keys(normalized).map((key) => {
      const {
        prefix,
        iconName,
        icon: icon2
      } = normalized[key];
      const aliases = icon2[2];
      if (!additions[prefix]) additions[prefix] = {};
      if (aliases.length > 0) {
        aliases.forEach((alias) => {
          if (typeof alias === "string") {
            additions[prefix][alias] = icon2;
          }
        });
      }
      additions[prefix][iconName] = icon2;
    });
    return additions;
  }
}
let _plugins = [];
let _hooks = {};
const providers = {};
const defaultProviderKeys = Object.keys(providers);
function registerPlugins(nextPlugins, _ref) {
  let {
    mixoutsTo: obj
  } = _ref;
  _plugins = nextPlugins;
  _hooks = {};
  Object.keys(providers).forEach((k) => {
    if (defaultProviderKeys.indexOf(k) === -1) {
      delete providers[k];
    }
  });
  _plugins.forEach((plugin) => {
    const mixout = plugin.mixout ? plugin.mixout() : {};
    Object.keys(mixout).forEach((tk2) => {
      if (typeof mixout[tk2] === "function") {
        obj[tk2] = mixout[tk2];
      }
      if (typeof mixout[tk2] === "object") {
        Object.keys(mixout[tk2]).forEach((sk2) => {
          if (!obj[tk2]) {
            obj[tk2] = {};
          }
          obj[tk2][sk2] = mixout[tk2][sk2];
        });
      }
    });
    if (plugin.hooks) {
      const hooks = plugin.hooks();
      Object.keys(hooks).forEach((hook) => {
        if (!_hooks[hook]) {
          _hooks[hook] = [];
        }
        _hooks[hook].push(hooks[hook]);
      });
    }
    if (plugin.provides) {
      plugin.provides(providers);
    }
  });
  return obj;
}
function chainHooks(hook, accumulator) {
  for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }
  const hookFns = _hooks[hook] || [];
  hookFns.forEach((hookFn) => {
    accumulator = hookFn.apply(null, [accumulator, ...args]);
  });
  return accumulator;
}
function callHooks(hook) {
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }
  const hookFns = _hooks[hook] || [];
  hookFns.forEach((hookFn) => {
    hookFn.apply(null, args);
  });
  return void 0;
}
function callProvided() {
  const hook = arguments[0];
  const args = Array.prototype.slice.call(arguments, 1);
  return providers[hook] ? providers[hook].apply(null, args) : void 0;
}
function findIconDefinition(iconLookup) {
  if (iconLookup.prefix === "fa") {
    iconLookup.prefix = "fas";
  }
  let {
    iconName
  } = iconLookup;
  const prefix = iconLookup.prefix || getDefaultUsablePrefix();
  if (!iconName) return;
  iconName = byAlias(prefix, iconName) || iconName;
  return iconFromMapping(library.definitions, prefix, iconName) || iconFromMapping(namespace.styles, prefix, iconName);
}
const library = new Library();
const noAuto = () => {
  config.autoReplaceSvg = false;
  config.observeMutations = false;
  callHooks("noAuto");
};
const dom = {
  i2svg: function() {
    let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (IS_DOM) {
      callHooks("beforeI2svg", params);
      callProvided("pseudoElements2svg", params);
      return callProvided("i2svg", params);
    } else {
      return Promise.reject(new Error("Operation requires a DOM of some kind."));
    }
  },
  watch: function() {
    let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    const {
      autoReplaceSvgRoot
    } = params;
    if (config.autoReplaceSvg === false) {
      config.autoReplaceSvg = true;
    }
    config.observeMutations = true;
    domready(() => {
      autoReplace({
        autoReplaceSvgRoot
      });
      callHooks("watch", params);
    });
  }
};
const parse = {
  icon: (icon2) => {
    if (icon2 === null) {
      return null;
    }
    if (typeof icon2 === "object" && icon2.prefix && icon2.iconName) {
      return {
        prefix: icon2.prefix,
        iconName: byAlias(icon2.prefix, icon2.iconName) || icon2.iconName
      };
    }
    if (Array.isArray(icon2) && icon2.length === 2) {
      const iconName = icon2[1].indexOf("fa-") === 0 ? icon2[1].slice(3) : icon2[1];
      const prefix = getCanonicalPrefix(icon2[0]);
      return {
        prefix,
        iconName: byAlias(prefix, iconName) || iconName
      };
    }
    if (typeof icon2 === "string" && (icon2.indexOf("".concat(config.cssPrefix, "-")) > -1 || icon2.match(ICON_SELECTION_SYNTAX_PATTERN))) {
      const canonicalIcon = getCanonicalIcon(icon2.split(" "), {
        skipLookups: true
      });
      return {
        prefix: canonicalIcon.prefix || getDefaultUsablePrefix(),
        iconName: byAlias(canonicalIcon.prefix, canonicalIcon.iconName) || canonicalIcon.iconName
      };
    }
    if (typeof icon2 === "string") {
      const prefix = getDefaultUsablePrefix();
      return {
        prefix,
        iconName: byAlias(prefix, icon2) || icon2
      };
    }
  }
};
const api = {
  noAuto,
  config,
  dom,
  parse,
  library,
  findIconDefinition,
  toHtml
};
const autoReplace = function() {
  let params = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const {
    autoReplaceSvgRoot = DOCUMENT
  } = params;
  if ((Object.keys(namespace.styles).length > 0 || config.autoFetchSvg) && IS_DOM && config.autoReplaceSvg) api.dom.i2svg({
    node: autoReplaceSvgRoot
  });
};
function domVariants(val, abstractCreator) {
  Object.defineProperty(val, "abstract", {
    get: abstractCreator
  });
  Object.defineProperty(val, "html", {
    get: function() {
      return val.abstract.map((a2) => toHtml(a2));
    }
  });
  Object.defineProperty(val, "node", {
    get: function() {
      if (!IS_DOM) return;
      const container = DOCUMENT.createElement("div");
      container.innerHTML = val.html;
      return container.children;
    }
  });
  return val;
}
function asIcon(_ref) {
  let {
    children,
    main,
    mask,
    attributes,
    styles: styles2,
    transform
  } = _ref;
  if (transformIsMeaningful(transform) && main.found && !mask.found) {
    const {
      width,
      height
    } = main;
    const offset = {
      x: width / height / 2,
      y: 0.5
    };
    attributes["style"] = joinStyles(_objectSpread2$1(_objectSpread2$1({}, styles2), {}, {
      "transform-origin": "".concat(offset.x + transform.x / 16, "em ").concat(offset.y + transform.y / 16, "em")
    }));
  }
  return [{
    tag: "svg",
    attributes,
    children
  }];
}
function asSymbol(_ref) {
  let {
    prefix,
    iconName,
    children,
    attributes,
    symbol
  } = _ref;
  const id2 = symbol === true ? "".concat(prefix, "-").concat(config.cssPrefix, "-").concat(iconName) : symbol;
  return [{
    tag: "svg",
    attributes: {
      style: "display: none;"
    },
    children: [{
      tag: "symbol",
      attributes: _objectSpread2$1(_objectSpread2$1({}, attributes), {}, {
        id: id2
      }),
      children
    }]
  }];
}
function makeInlineSvgAbstract(params) {
  const {
    icons: {
      main,
      mask
    },
    prefix,
    iconName,
    transform,
    symbol,
    title,
    maskId,
    titleId,
    extra,
    watchable = false
  } = params;
  const {
    width,
    height
  } = mask.found ? mask : main;
  const isUploadedIcon = Lt.includes(prefix);
  const attrClass = [config.replacementClass, iconName ? "".concat(config.cssPrefix, "-").concat(iconName) : ""].filter((c$$1) => extra.classes.indexOf(c$$1) === -1).filter((c$$1) => c$$1 !== "" || !!c$$1).concat(extra.classes).join(" ");
  let content = {
    children: [],
    attributes: _objectSpread2$1(_objectSpread2$1({}, extra.attributes), {}, {
      "data-prefix": prefix,
      "data-icon": iconName,
      "class": attrClass,
      "role": extra.attributes.role || "img",
      "xmlns": "http://www.w3.org/2000/svg",
      "viewBox": "0 0 ".concat(width, " ").concat(height)
    })
  };
  const uploadedIconWidthStyle = isUploadedIcon && !~extra.classes.indexOf("fa-fw") ? {
    width: "".concat(width / height * 16 * 0.0625, "em")
  } : {};
  if (watchable) {
    content.attributes[DATA_FA_I2SVG] = "";
  }
  if (title) {
    content.children.push({
      tag: "title",
      attributes: {
        id: content.attributes["aria-labelledby"] || "title-".concat(titleId || nextUniqueId())
      },
      children: [title]
    });
    delete content.attributes.title;
  }
  const args = _objectSpread2$1(_objectSpread2$1({}, content), {}, {
    prefix,
    iconName,
    main,
    mask,
    maskId,
    transform,
    symbol,
    styles: _objectSpread2$1(_objectSpread2$1({}, uploadedIconWidthStyle), extra.styles)
  });
  const {
    children,
    attributes
  } = mask.found && main.found ? callProvided("generateAbstractMask", args) || {
    children: [],
    attributes: {}
  } : callProvided("generateAbstractIcon", args) || {
    children: [],
    attributes: {}
  };
  args.children = children;
  args.attributes = attributes;
  if (symbol) {
    return asSymbol(args);
  } else {
    return asIcon(args);
  }
}
function makeLayersTextAbstract(params) {
  const {
    content,
    width,
    height,
    transform,
    title,
    extra,
    watchable = false
  } = params;
  const attributes = _objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, extra.attributes), title ? {
    "title": title
  } : {}), {}, {
    "class": extra.classes.join(" ")
  });
  if (watchable) {
    attributes[DATA_FA_I2SVG] = "";
  }
  const styles2 = _objectSpread2$1({}, extra.styles);
  if (transformIsMeaningful(transform)) {
    styles2["transform"] = transformForCss({
      transform,
      startCentered: true,
      width,
      height
    });
    styles2["-webkit-transform"] = styles2["transform"];
  }
  const styleString = joinStyles(styles2);
  if (styleString.length > 0) {
    attributes["style"] = styleString;
  }
  const val = [];
  val.push({
    tag: "span",
    attributes,
    children: [content]
  });
  if (title) {
    val.push({
      tag: "span",
      attributes: {
        class: "sr-only"
      },
      children: [title]
    });
  }
  return val;
}
function makeLayersCounterAbstract(params) {
  const {
    content,
    title,
    extra
  } = params;
  const attributes = _objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, extra.attributes), title ? {
    "title": title
  } : {}), {}, {
    "class": extra.classes.join(" ")
  });
  const styleString = joinStyles(extra.styles);
  if (styleString.length > 0) {
    attributes["style"] = styleString;
  }
  const val = [];
  val.push({
    tag: "span",
    attributes,
    children: [content]
  });
  if (title) {
    val.push({
      tag: "span",
      attributes: {
        class: "sr-only"
      },
      children: [title]
    });
  }
  return val;
}
const {
  styles: styles$1$1
} = namespace;
function asFoundIcon(icon2) {
  const width = icon2[0];
  const height = icon2[1];
  const [vectorData] = icon2.slice(4);
  let element = null;
  if (Array.isArray(vectorData)) {
    element = {
      tag: "g",
      attributes: {
        class: "".concat(config.cssPrefix, "-").concat(DUOTONE_CLASSES.GROUP)
      },
      children: [{
        tag: "path",
        attributes: {
          class: "".concat(config.cssPrefix, "-").concat(DUOTONE_CLASSES.SECONDARY),
          fill: "currentColor",
          d: vectorData[0]
        }
      }, {
        tag: "path",
        attributes: {
          class: "".concat(config.cssPrefix, "-").concat(DUOTONE_CLASSES.PRIMARY),
          fill: "currentColor",
          d: vectorData[1]
        }
      }]
    };
  } else {
    element = {
      tag: "path",
      attributes: {
        fill: "currentColor",
        d: vectorData
      }
    };
  }
  return {
    found: true,
    width,
    height,
    icon: element
  };
}
const missingIconResolutionMixin = {
  found: false,
  width: 512,
  height: 512
};
function maybeNotifyMissing(iconName, prefix) {
  if (!PRODUCTION$1 && !config.showMissingIcons && iconName) {
    console.error('Icon with name "'.concat(iconName, '" and prefix "').concat(prefix, '" is missing.'));
  }
}
function findIcon(iconName, prefix) {
  let givenPrefix = prefix;
  if (prefix === "fa" && config.styleDefault !== null) {
    prefix = getDefaultUsablePrefix();
  }
  return new Promise((resolve, reject) => {
    if (givenPrefix === "fa") {
      const shim = byOldName(iconName) || {};
      iconName = shim.iconName || iconName;
      prefix = shim.prefix || prefix;
    }
    if (iconName && prefix && styles$1$1[prefix] && styles$1$1[prefix][iconName]) {
      const icon2 = styles$1$1[prefix][iconName];
      return resolve(asFoundIcon(icon2));
    }
    maybeNotifyMissing(iconName, prefix);
    resolve(_objectSpread2$1(_objectSpread2$1({}, missingIconResolutionMixin), {}, {
      icon: config.showMissingIcons && iconName ? callProvided("missingIconAbstract") || {} : {}
    }));
  });
}
const noop$1 = () => {
};
const p$2$1 = config.measurePerformance && PERFORMANCE && PERFORMANCE.mark && PERFORMANCE.measure ? PERFORMANCE : {
  mark: noop$1,
  measure: noop$1
};
const preamble = 'FA "6.7.2"';
const begin = (name) => {
  p$2$1.mark("".concat(preamble, " ").concat(name, " begins"));
  return () => end(name);
};
const end = (name) => {
  p$2$1.mark("".concat(preamble, " ").concat(name, " ends"));
  p$2$1.measure("".concat(preamble, " ").concat(name), "".concat(preamble, " ").concat(name, " begins"), "".concat(preamble, " ").concat(name, " ends"));
};
var perf = {
  begin,
  end
};
const noop$2 = () => {
};
function isWatched(node) {
  const i2svg = node.getAttribute ? node.getAttribute(DATA_FA_I2SVG) : null;
  return typeof i2svg === "string";
}
function hasPrefixAndIcon(node) {
  const prefix = node.getAttribute ? node.getAttribute(DATA_PREFIX) : null;
  const icon2 = node.getAttribute ? node.getAttribute(DATA_ICON) : null;
  return prefix && icon2;
}
function hasBeenReplaced(node) {
  return node && node.classList && node.classList.contains && node.classList.contains(config.replacementClass);
}
function getMutator() {
  if (config.autoReplaceSvg === true) {
    return mutators.replace;
  }
  const mutator = mutators[config.autoReplaceSvg];
  return mutator || mutators.replace;
}
function createElementNS(tag) {
  return DOCUMENT.createElementNS("http://www.w3.org/2000/svg", tag);
}
function createElement(tag) {
  return DOCUMENT.createElement(tag);
}
function convertSVG(abstractObj) {
  let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    ceFn = abstractObj.tag === "svg" ? createElementNS : createElement
  } = params;
  if (typeof abstractObj === "string") {
    return DOCUMENT.createTextNode(abstractObj);
  }
  const tag = ceFn(abstractObj.tag);
  Object.keys(abstractObj.attributes || []).forEach(function(key) {
    tag.setAttribute(key, abstractObj.attributes[key]);
  });
  const children = abstractObj.children || [];
  children.forEach(function(child) {
    tag.appendChild(convertSVG(child, {
      ceFn
    }));
  });
  return tag;
}
function nodeAsComment(node) {
  let comment = " ".concat(node.outerHTML, " ");
  comment = "".concat(comment, "Font Awesome fontawesome.com ");
  return comment;
}
const mutators = {
  replace: function(mutation) {
    const node = mutation[0];
    if (node.parentNode) {
      mutation[1].forEach((abstract) => {
        node.parentNode.insertBefore(convertSVG(abstract), node);
      });
      if (node.getAttribute(DATA_FA_I2SVG) === null && config.keepOriginalSource) {
        let comment = DOCUMENT.createComment(nodeAsComment(node));
        node.parentNode.replaceChild(comment, node);
      } else {
        node.remove();
      }
    }
  },
  nest: function(mutation) {
    const node = mutation[0];
    const abstract = mutation[1];
    if (~classArray(node).indexOf(config.replacementClass)) {
      return mutators.replace(mutation);
    }
    const forSvg = new RegExp("".concat(config.cssPrefix, "-.*"));
    delete abstract[0].attributes.id;
    if (abstract[0].attributes.class) {
      const splitClasses = abstract[0].attributes.class.split(" ").reduce((acc, cls) => {
        if (cls === config.replacementClass || cls.match(forSvg)) {
          acc.toSvg.push(cls);
        } else {
          acc.toNode.push(cls);
        }
        return acc;
      }, {
        toNode: [],
        toSvg: []
      });
      abstract[0].attributes.class = splitClasses.toSvg.join(" ");
      if (splitClasses.toNode.length === 0) {
        node.removeAttribute("class");
      } else {
        node.setAttribute("class", splitClasses.toNode.join(" "));
      }
    }
    const newInnerHTML = abstract.map((a2) => toHtml(a2)).join("\n");
    node.setAttribute(DATA_FA_I2SVG, "");
    node.innerHTML = newInnerHTML;
  }
};
function performOperationSync(op) {
  op();
}
function perform(mutations, callback) {
  const callbackFunction = typeof callback === "function" ? callback : noop$2;
  if (mutations.length === 0) {
    callbackFunction();
  } else {
    let frame = performOperationSync;
    if (config.mutateApproach === MUTATION_APPROACH_ASYNC) {
      frame = WINDOW.requestAnimationFrame || performOperationSync;
    }
    frame(() => {
      const mutator = getMutator();
      const mark = perf.begin("mutate");
      mutations.map(mutator);
      mark();
      callbackFunction();
    });
  }
}
let disabled$1 = false;
function disableObservation() {
  disabled$1 = true;
}
function enableObservation() {
  disabled$1 = false;
}
let mo = null;
function observe(options) {
  if (!MUTATION_OBSERVER) {
    return;
  }
  if (!config.observeMutations) {
    return;
  }
  const {
    treeCallback = noop$2,
    nodeCallback = noop$2,
    pseudoElementsCallback = noop$2,
    observeMutationsRoot = DOCUMENT
  } = options;
  mo = new MUTATION_OBSERVER((objects) => {
    if (disabled$1) return;
    const defaultPrefix = getDefaultUsablePrefix();
    toArray(objects).forEach((mutationRecord) => {
      if (mutationRecord.type === "childList" && mutationRecord.addedNodes.length > 0 && !isWatched(mutationRecord.addedNodes[0])) {
        if (config.searchPseudoElements) {
          pseudoElementsCallback(mutationRecord.target);
        }
        treeCallback(mutationRecord.target);
      }
      if (mutationRecord.type === "attributes" && mutationRecord.target.parentNode && config.searchPseudoElements) {
        pseudoElementsCallback(mutationRecord.target.parentNode);
      }
      if (mutationRecord.type === "attributes" && isWatched(mutationRecord.target) && ~ATTRIBUTES_WATCHED_FOR_MUTATION.indexOf(mutationRecord.attributeName)) {
        if (mutationRecord.attributeName === "class" && hasPrefixAndIcon(mutationRecord.target)) {
          const {
            prefix,
            iconName
          } = getCanonicalIcon(classArray(mutationRecord.target));
          mutationRecord.target.setAttribute(DATA_PREFIX, prefix || defaultPrefix);
          if (iconName) mutationRecord.target.setAttribute(DATA_ICON, iconName);
        } else if (hasBeenReplaced(mutationRecord.target)) {
          nodeCallback(mutationRecord.target);
        }
      }
    });
  });
  if (!IS_DOM) return;
  mo.observe(observeMutationsRoot, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true
  });
}
function disconnect() {
  if (!mo) return;
  mo.disconnect();
}
function styleParser(node) {
  const style = node.getAttribute("style");
  let val = [];
  if (style) {
    val = style.split(";").reduce((acc, style2) => {
      const styles2 = style2.split(":");
      const prop = styles2[0];
      const value = styles2.slice(1);
      if (prop && value.length > 0) {
        acc[prop] = value.join(":").trim();
      }
      return acc;
    }, {});
  }
  return val;
}
function classParser(node) {
  const existingPrefix = node.getAttribute("data-prefix");
  const existingIconName = node.getAttribute("data-icon");
  const innerText = node.innerText !== void 0 ? node.innerText.trim() : "";
  let val = getCanonicalIcon(classArray(node));
  if (!val.prefix) {
    val.prefix = getDefaultUsablePrefix();
  }
  if (existingPrefix && existingIconName) {
    val.prefix = existingPrefix;
    val.iconName = existingIconName;
  }
  if (val.iconName && val.prefix) {
    return val;
  }
  if (val.prefix && innerText.length > 0) {
    val.iconName = byLigature(val.prefix, node.innerText) || byUnicode(val.prefix, toHex(node.innerText));
  }
  if (!val.iconName && config.autoFetchSvg && node.firstChild && node.firstChild.nodeType === Node.TEXT_NODE) {
    val.iconName = node.firstChild.data;
  }
  return val;
}
function attributesParser(node) {
  const extraAttributes = toArray(node.attributes).reduce((acc, attr) => {
    if (acc.name !== "class" && acc.name !== "style") {
      acc[attr.name] = attr.value;
    }
    return acc;
  }, {});
  const title = node.getAttribute("title");
  const titleId = node.getAttribute("data-fa-title-id");
  if (config.autoA11y) {
    if (title) {
      extraAttributes["aria-labelledby"] = "".concat(config.replacementClass, "-title-").concat(titleId || nextUniqueId());
    } else {
      extraAttributes["aria-hidden"] = "true";
      extraAttributes["focusable"] = "false";
    }
  }
  return extraAttributes;
}
function blankMeta() {
  return {
    iconName: null,
    title: null,
    titleId: null,
    prefix: null,
    transform: meaninglessTransform,
    symbol: false,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    extra: {
      classes: [],
      styles: {},
      attributes: {}
    }
  };
}
function parseMeta(node) {
  let parser = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
    styleParser: true
  };
  const {
    iconName,
    prefix,
    rest: extraClasses
  } = classParser(node);
  const extraAttributes = attributesParser(node);
  const pluginMeta = chainHooks("parseNodeAttributes", {}, node);
  let extraStyles = parser.styleParser ? styleParser(node) : [];
  return _objectSpread2$1({
    iconName,
    title: node.getAttribute("title"),
    titleId: node.getAttribute("data-fa-title-id"),
    prefix,
    transform: meaninglessTransform,
    mask: {
      iconName: null,
      prefix: null,
      rest: []
    },
    maskId: null,
    symbol: false,
    extra: {
      classes: extraClasses,
      styles: extraStyles,
      attributes: extraAttributes
    }
  }, pluginMeta);
}
const {
  styles: styles$2
} = namespace;
function generateMutation(node) {
  const nodeMeta = config.autoReplaceSvg === "nest" ? parseMeta(node, {
    styleParser: false
  }) : parseMeta(node);
  if (~nodeMeta.extra.classes.indexOf(LAYERS_TEXT_CLASSNAME)) {
    return callProvided("generateLayersText", node, nodeMeta);
  } else {
    return callProvided("generateSvgReplacementMutation", node, nodeMeta);
  }
}
function getKnownPrefixes() {
  return [...Ft, ...Ia];
}
function onTree(root) {
  let callback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  if (!IS_DOM) return Promise.resolve();
  const htmlClassList = DOCUMENT.documentElement.classList;
  const hclAdd = (suffix) => htmlClassList.add("".concat(HTML_CLASS_I2SVG_BASE_CLASS, "-").concat(suffix));
  const hclRemove = (suffix) => htmlClassList.remove("".concat(HTML_CLASS_I2SVG_BASE_CLASS, "-").concat(suffix));
  const prefixes = config.autoFetchSvg ? getKnownPrefixes() : P.concat(Object.keys(styles$2));
  if (!prefixes.includes("fa")) {
    prefixes.push("fa");
  }
  const prefixesDomQuery = [".".concat(LAYERS_TEXT_CLASSNAME, ":not([").concat(DATA_FA_I2SVG, "])")].concat(prefixes.map((p$$1) => ".".concat(p$$1, ":not([").concat(DATA_FA_I2SVG, "])"))).join(", ");
  if (prefixesDomQuery.length === 0) {
    return Promise.resolve();
  }
  let candidates = [];
  try {
    candidates = toArray(root.querySelectorAll(prefixesDomQuery));
  } catch (e$$1) {
  }
  if (candidates.length > 0) {
    hclAdd("pending");
    hclRemove("complete");
  } else {
    return Promise.resolve();
  }
  const mark = perf.begin("onTree");
  const mutations = candidates.reduce((acc, node) => {
    try {
      const mutation = generateMutation(node);
      if (mutation) {
        acc.push(mutation);
      }
    } catch (e$$1) {
      if (!PRODUCTION$1) {
        if (e$$1.name === "MissingIcon") {
          console.error(e$$1);
        }
      }
    }
    return acc;
  }, []);
  return new Promise((resolve, reject) => {
    Promise.all(mutations).then((resolvedMutations) => {
      perform(resolvedMutations, () => {
        hclAdd("active");
        hclAdd("complete");
        hclRemove("pending");
        if (typeof callback === "function") callback();
        mark();
        resolve();
      });
    }).catch((e$$1) => {
      mark();
      reject(e$$1);
    });
  });
}
function onNode(node) {
  let callback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
  generateMutation(node).then((mutation) => {
    if (mutation) {
      perform([mutation], callback);
    }
  });
}
function resolveIcons(next) {
  return function(maybeIconDefinition) {
    let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    const iconDefinition = (maybeIconDefinition || {}).icon ? maybeIconDefinition : findIconDefinition(maybeIconDefinition || {});
    let {
      mask
    } = params;
    if (mask) {
      mask = (mask || {}).icon ? mask : findIconDefinition(mask || {});
    }
    return next(iconDefinition, _objectSpread2$1(_objectSpread2$1({}, params), {}, {
      mask
    }));
  };
}
const render = function(iconDefinition) {
  let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    transform = meaninglessTransform,
    symbol = false,
    mask = null,
    maskId = null,
    title = null,
    titleId = null,
    classes = [],
    attributes = {},
    styles: styles2 = {}
  } = params;
  if (!iconDefinition) return;
  const {
    prefix,
    iconName,
    icon: icon2
  } = iconDefinition;
  return domVariants(_objectSpread2$1({
    type: "icon"
  }, iconDefinition), () => {
    callHooks("beforeDOMElementCreation", {
      iconDefinition,
      params
    });
    if (config.autoA11y) {
      if (title) {
        attributes["aria-labelledby"] = "".concat(config.replacementClass, "-title-").concat(titleId || nextUniqueId());
      } else {
        attributes["aria-hidden"] = "true";
        attributes["focusable"] = "false";
      }
    }
    return makeInlineSvgAbstract({
      icons: {
        main: asFoundIcon(icon2),
        mask: mask ? asFoundIcon(mask.icon) : {
          found: false,
          width: null,
          height: null,
          icon: {}
        }
      },
      prefix,
      iconName,
      transform: _objectSpread2$1(_objectSpread2$1({}, meaninglessTransform), transform),
      symbol,
      title,
      maskId,
      titleId,
      extra: {
        attributes,
        styles: styles2,
        classes
      }
    });
  });
};
var ReplaceElements = {
  mixout() {
    return {
      icon: resolveIcons(render)
    };
  },
  hooks() {
    return {
      mutationObserverCallbacks(accumulator) {
        accumulator.treeCallback = onTree;
        accumulator.nodeCallback = onNode;
        return accumulator;
      }
    };
  },
  provides(providers$$1) {
    providers$$1.i2svg = function(params) {
      const {
        node = DOCUMENT,
        callback = () => {
        }
      } = params;
      return onTree(node, callback);
    };
    providers$$1.generateSvgReplacementMutation = function(node, nodeMeta) {
      const {
        iconName,
        title,
        titleId,
        prefix,
        transform,
        symbol,
        mask,
        maskId,
        extra
      } = nodeMeta;
      return new Promise((resolve, reject) => {
        Promise.all([findIcon(iconName, prefix), mask.iconName ? findIcon(mask.iconName, mask.prefix) : Promise.resolve({
          found: false,
          width: 512,
          height: 512,
          icon: {}
        })]).then((_ref) => {
          let [main, mask2] = _ref;
          resolve([node, makeInlineSvgAbstract({
            icons: {
              main,
              mask: mask2
            },
            prefix,
            iconName,
            transform,
            symbol,
            maskId,
            title,
            titleId,
            extra,
            watchable: true
          })]);
        }).catch(reject);
      });
    };
    providers$$1.generateAbstractIcon = function(_ref2) {
      let {
        children,
        attributes,
        main,
        transform,
        styles: styles2
      } = _ref2;
      const styleString = joinStyles(styles2);
      if (styleString.length > 0) {
        attributes["style"] = styleString;
      }
      let nextChild;
      if (transformIsMeaningful(transform)) {
        nextChild = callProvided("generateAbstractTransformGrouping", {
          main,
          transform,
          containerWidth: main.width,
          iconWidth: main.width
        });
      }
      children.push(nextChild || main.icon);
      return {
        children,
        attributes
      };
    };
  }
};
var Layers = {
  mixout() {
    return {
      layer(assembler) {
        let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          classes = []
        } = params;
        return domVariants({
          type: "layer"
        }, () => {
          callHooks("beforeDOMElementCreation", {
            assembler,
            params
          });
          let children = [];
          assembler((args) => {
            Array.isArray(args) ? args.map((a2) => {
              children = children.concat(a2.abstract);
            }) : children = children.concat(args.abstract);
          });
          return [{
            tag: "span",
            attributes: {
              class: ["".concat(config.cssPrefix, "-layers"), ...classes].join(" ")
            },
            children
          }];
        });
      }
    };
  }
};
var LayersCounter = {
  mixout() {
    return {
      counter(content) {
        let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          title = null,
          classes = [],
          attributes = {},
          styles: styles2 = {}
        } = params;
        return domVariants({
          type: "counter",
          content
        }, () => {
          callHooks("beforeDOMElementCreation", {
            content,
            params
          });
          return makeLayersCounterAbstract({
            content: content.toString(),
            title,
            extra: {
              attributes,
              styles: styles2,
              classes: ["".concat(config.cssPrefix, "-layers-counter"), ...classes]
            }
          });
        });
      }
    };
  }
};
var LayersText = {
  mixout() {
    return {
      text(content) {
        let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const {
          transform = meaninglessTransform,
          title = null,
          classes = [],
          attributes = {},
          styles: styles2 = {}
        } = params;
        return domVariants({
          type: "text",
          content
        }, () => {
          callHooks("beforeDOMElementCreation", {
            content,
            params
          });
          return makeLayersTextAbstract({
            content,
            transform: _objectSpread2$1(_objectSpread2$1({}, meaninglessTransform), transform),
            title,
            extra: {
              attributes,
              styles: styles2,
              classes: ["".concat(config.cssPrefix, "-layers-text"), ...classes]
            }
          });
        });
      }
    };
  },
  provides(providers$$1) {
    providers$$1.generateLayersText = function(node, nodeMeta) {
      const {
        title,
        transform,
        extra
      } = nodeMeta;
      let width = null;
      let height = null;
      if (IS_IE) {
        const computedFontSize = parseInt(getComputedStyle(node).fontSize, 10);
        const boundingClientRect = node.getBoundingClientRect();
        width = boundingClientRect.width / computedFontSize;
        height = boundingClientRect.height / computedFontSize;
      }
      if (config.autoA11y && !title) {
        extra.attributes["aria-hidden"] = "true";
      }
      return Promise.resolve([node, makeLayersTextAbstract({
        content: node.innerHTML,
        width,
        height,
        transform,
        title,
        extra,
        watchable: true
      })]);
    };
  }
};
const CLEAN_CONTENT_PATTERN = new RegExp('"', "ug");
const SECONDARY_UNICODE_RANGE = [1105920, 1112319];
const _FONT_FAMILY_WEIGHT_TO_PREFIX = _objectSpread2$1(_objectSpread2$1(_objectSpread2$1(_objectSpread2$1({}, {
  FontAwesome: {
    normal: "fas",
    400: "fas"
  }
}), lt), wa), Yt);
const FONT_FAMILY_WEIGHT_TO_PREFIX = Object.keys(_FONT_FAMILY_WEIGHT_TO_PREFIX).reduce((acc, key) => {
  acc[key.toLowerCase()] = _FONT_FAMILY_WEIGHT_TO_PREFIX[key];
  return acc;
}, {});
const FONT_FAMILY_WEIGHT_FALLBACK = Object.keys(FONT_FAMILY_WEIGHT_TO_PREFIX).reduce((acc, fontFamily) => {
  const weights = FONT_FAMILY_WEIGHT_TO_PREFIX[fontFamily];
  acc[fontFamily] = weights[900] || [...Object.entries(weights)][0][1];
  return acc;
}, {});
function hexValueFromContent(content) {
  const cleaned = content.replace(CLEAN_CONTENT_PATTERN, "");
  const codePoint = codePointAt(cleaned, 0);
  const isPrependTen = codePoint >= SECONDARY_UNICODE_RANGE[0] && codePoint <= SECONDARY_UNICODE_RANGE[1];
  const isDoubled = cleaned.length === 2 ? cleaned[0] === cleaned[1] : false;
  return {
    value: isDoubled ? toHex(cleaned[0]) : toHex(cleaned),
    isSecondary: isPrependTen || isDoubled
  };
}
function getPrefix(fontFamily, fontWeight) {
  const fontFamilySanitized = fontFamily.replace(/^['"]|['"]$/g, "").toLowerCase();
  const fontWeightInteger = parseInt(fontWeight);
  const fontWeightSanitized = isNaN(fontWeightInteger) ? "normal" : fontWeightInteger;
  return (FONT_FAMILY_WEIGHT_TO_PREFIX[fontFamilySanitized] || {})[fontWeightSanitized] || FONT_FAMILY_WEIGHT_FALLBACK[fontFamilySanitized];
}
function replaceForPosition(node, position) {
  const pendingAttribute = "".concat(DATA_FA_PSEUDO_ELEMENT_PENDING).concat(position.replace(":", "-"));
  return new Promise((resolve, reject) => {
    if (node.getAttribute(pendingAttribute) !== null) {
      return resolve();
    }
    const children = toArray(node.children);
    const alreadyProcessedPseudoElement = children.filter((c$$1) => c$$1.getAttribute(DATA_FA_PSEUDO_ELEMENT) === position)[0];
    const styles2 = WINDOW.getComputedStyle(node, position);
    const fontFamily = styles2.getPropertyValue("font-family");
    const fontFamilyMatch = fontFamily.match(FONT_FAMILY_PATTERN);
    const fontWeight = styles2.getPropertyValue("font-weight");
    const content = styles2.getPropertyValue("content");
    if (alreadyProcessedPseudoElement && !fontFamilyMatch) {
      node.removeChild(alreadyProcessedPseudoElement);
      return resolve();
    } else if (fontFamilyMatch && content !== "none" && content !== "") {
      const content2 = styles2.getPropertyValue("content");
      let prefix = getPrefix(fontFamily, fontWeight);
      const {
        value: hexValue,
        isSecondary
      } = hexValueFromContent(content2);
      const isV4 = fontFamilyMatch[0].startsWith("FontAwesome");
      let iconName = byUnicode(prefix, hexValue);
      let iconIdentifier = iconName;
      if (isV4) {
        const iconName4 = byOldUnicode(hexValue);
        if (iconName4.iconName && iconName4.prefix) {
          iconName = iconName4.iconName;
          prefix = iconName4.prefix;
        }
      }
      if (iconName && !isSecondary && (!alreadyProcessedPseudoElement || alreadyProcessedPseudoElement.getAttribute(DATA_PREFIX) !== prefix || alreadyProcessedPseudoElement.getAttribute(DATA_ICON) !== iconIdentifier)) {
        node.setAttribute(pendingAttribute, iconIdentifier);
        if (alreadyProcessedPseudoElement) {
          node.removeChild(alreadyProcessedPseudoElement);
        }
        const meta = blankMeta();
        const {
          extra
        } = meta;
        extra.attributes[DATA_FA_PSEUDO_ELEMENT] = position;
        findIcon(iconName, prefix).then((main) => {
          const abstract = makeInlineSvgAbstract(_objectSpread2$1(_objectSpread2$1({}, meta), {}, {
            icons: {
              main,
              mask: emptyCanonicalIcon()
            },
            prefix,
            iconName: iconIdentifier,
            extra,
            watchable: true
          }));
          const element = DOCUMENT.createElementNS("http://www.w3.org/2000/svg", "svg");
          if (position === "::before") {
            node.insertBefore(element, node.firstChild);
          } else {
            node.appendChild(element);
          }
          element.outerHTML = abstract.map((a$$1) => toHtml(a$$1)).join("\n");
          node.removeAttribute(pendingAttribute);
          resolve();
        }).catch(reject);
      } else {
        resolve();
      }
    } else {
      resolve();
    }
  });
}
function replace(node) {
  return Promise.all([replaceForPosition(node, "::before"), replaceForPosition(node, "::after")]);
}
function processable(node) {
  return node.parentNode !== document.head && !~TAGNAMES_TO_SKIP_FOR_PSEUDOELEMENTS.indexOf(node.tagName.toUpperCase()) && !node.getAttribute(DATA_FA_PSEUDO_ELEMENT) && (!node.parentNode || node.parentNode.tagName !== "svg");
}
function searchPseudoElements(root) {
  if (!IS_DOM) return;
  return new Promise((resolve, reject) => {
    const operations = toArray(root.querySelectorAll("*")).filter(processable).map(replace);
    const end2 = perf.begin("searchPseudoElements");
    disableObservation();
    Promise.all(operations).then(() => {
      end2();
      enableObservation();
      resolve();
    }).catch(() => {
      end2();
      enableObservation();
      reject();
    });
  });
}
var PseudoElements = {
  hooks() {
    return {
      mutationObserverCallbacks(accumulator) {
        accumulator.pseudoElementsCallback = searchPseudoElements;
        return accumulator;
      }
    };
  },
  provides(providers2) {
    providers2.pseudoElements2svg = function(params) {
      const {
        node = DOCUMENT
      } = params;
      if (config.searchPseudoElements) {
        searchPseudoElements(node);
      }
    };
  }
};
let _unwatched = false;
var MutationObserver$1 = {
  mixout() {
    return {
      dom: {
        unwatch() {
          disableObservation();
          _unwatched = true;
        }
      }
    };
  },
  hooks() {
    return {
      bootstrap() {
        observe(chainHooks("mutationObserverCallbacks", {}));
      },
      noAuto() {
        disconnect();
      },
      watch(params) {
        const {
          observeMutationsRoot
        } = params;
        if (_unwatched) {
          enableObservation();
        } else {
          observe(chainHooks("mutationObserverCallbacks", {
            observeMutationsRoot
          }));
        }
      }
    };
  }
};
const parseTransformString = (transformString) => {
  let transform = {
    size: 16,
    x: 0,
    y: 0,
    flipX: false,
    flipY: false,
    rotate: 0
  };
  return transformString.toLowerCase().split(" ").reduce((acc, n2) => {
    const parts = n2.toLowerCase().split("-");
    const first = parts[0];
    let rest = parts.slice(1).join("-");
    if (first && rest === "h") {
      acc.flipX = true;
      return acc;
    }
    if (first && rest === "v") {
      acc.flipY = true;
      return acc;
    }
    rest = parseFloat(rest);
    if (isNaN(rest)) {
      return acc;
    }
    switch (first) {
      case "grow":
        acc.size = acc.size + rest;
        break;
      case "shrink":
        acc.size = acc.size - rest;
        break;
      case "left":
        acc.x = acc.x - rest;
        break;
      case "right":
        acc.x = acc.x + rest;
        break;
      case "up":
        acc.y = acc.y - rest;
        break;
      case "down":
        acc.y = acc.y + rest;
        break;
      case "rotate":
        acc.rotate = acc.rotate + rest;
        break;
    }
    return acc;
  }, transform);
};
var PowerTransforms = {
  mixout() {
    return {
      parse: {
        transform: (transformString) => {
          return parseTransformString(transformString);
        }
      }
    };
  },
  hooks() {
    return {
      parseNodeAttributes(accumulator, node) {
        const transformString = node.getAttribute("data-fa-transform");
        if (transformString) {
          accumulator.transform = parseTransformString(transformString);
        }
        return accumulator;
      }
    };
  },
  provides(providers2) {
    providers2.generateAbstractTransformGrouping = function(_ref) {
      let {
        main,
        transform,
        containerWidth,
        iconWidth
      } = _ref;
      const outer = {
        transform: "translate(".concat(containerWidth / 2, " 256)")
      };
      const innerTranslate = "translate(".concat(transform.x * 32, ", ").concat(transform.y * 32, ") ");
      const innerScale = "scale(".concat(transform.size / 16 * (transform.flipX ? -1 : 1), ", ").concat(transform.size / 16 * (transform.flipY ? -1 : 1), ") ");
      const innerRotate = "rotate(".concat(transform.rotate, " 0 0)");
      const inner = {
        transform: "".concat(innerTranslate, " ").concat(innerScale, " ").concat(innerRotate)
      };
      const path = {
        transform: "translate(".concat(iconWidth / 2 * -1, " -256)")
      };
      const operations = {
        outer,
        inner,
        path
      };
      return {
        tag: "g",
        attributes: _objectSpread2$1({}, operations.outer),
        children: [{
          tag: "g",
          attributes: _objectSpread2$1({}, operations.inner),
          children: [{
            tag: main.icon.tag,
            children: main.icon.children,
            attributes: _objectSpread2$1(_objectSpread2$1({}, main.icon.attributes), operations.path)
          }]
        }]
      };
    };
  }
};
const ALL_SPACE = {
  x: 0,
  y: 0,
  width: "100%",
  height: "100%"
};
function fillBlack(abstract) {
  let force = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
  if (abstract.attributes && (abstract.attributes.fill || force)) {
    abstract.attributes.fill = "black";
  }
  return abstract;
}
function deGroup(abstract) {
  if (abstract.tag === "g") {
    return abstract.children;
  } else {
    return [abstract];
  }
}
var Masks = {
  hooks() {
    return {
      parseNodeAttributes(accumulator, node) {
        const maskData = node.getAttribute("data-fa-mask");
        const mask = !maskData ? emptyCanonicalIcon() : getCanonicalIcon(maskData.split(" ").map((i2) => i2.trim()));
        if (!mask.prefix) {
          mask.prefix = getDefaultUsablePrefix();
        }
        accumulator.mask = mask;
        accumulator.maskId = node.getAttribute("data-fa-mask-id");
        return accumulator;
      }
    };
  },
  provides(providers2) {
    providers2.generateAbstractMask = function(_ref) {
      let {
        children,
        attributes,
        main,
        mask,
        maskId: explicitMaskId,
        transform
      } = _ref;
      const {
        width: mainWidth,
        icon: mainPath
      } = main;
      const {
        width: maskWidth,
        icon: maskPath
      } = mask;
      const trans = transformForSvg({
        transform,
        containerWidth: maskWidth,
        iconWidth: mainWidth
      });
      const maskRect = {
        tag: "rect",
        attributes: _objectSpread2$1(_objectSpread2$1({}, ALL_SPACE), {}, {
          fill: "white"
        })
      };
      const maskInnerGroupChildrenMixin = mainPath.children ? {
        children: mainPath.children.map(fillBlack)
      } : {};
      const maskInnerGroup = {
        tag: "g",
        attributes: _objectSpread2$1({}, trans.inner),
        children: [fillBlack(_objectSpread2$1({
          tag: mainPath.tag,
          attributes: _objectSpread2$1(_objectSpread2$1({}, mainPath.attributes), trans.path)
        }, maskInnerGroupChildrenMixin))]
      };
      const maskOuterGroup = {
        tag: "g",
        attributes: _objectSpread2$1({}, trans.outer),
        children: [maskInnerGroup]
      };
      const maskId = "mask-".concat(explicitMaskId || nextUniqueId());
      const clipId = "clip-".concat(explicitMaskId || nextUniqueId());
      const maskTag = {
        tag: "mask",
        attributes: _objectSpread2$1(_objectSpread2$1({}, ALL_SPACE), {}, {
          id: maskId,
          maskUnits: "userSpaceOnUse",
          maskContentUnits: "userSpaceOnUse"
        }),
        children: [maskRect, maskOuterGroup]
      };
      const defs = {
        tag: "defs",
        children: [{
          tag: "clipPath",
          attributes: {
            id: clipId
          },
          children: deGroup(maskPath)
        }, maskTag]
      };
      children.push(defs, {
        tag: "rect",
        attributes: _objectSpread2$1({
          fill: "currentColor",
          "clip-path": "url(#".concat(clipId, ")"),
          mask: "url(#".concat(maskId, ")")
        }, ALL_SPACE)
      });
      return {
        children,
        attributes
      };
    };
  }
};
var MissingIconIndicator = {
  provides(providers2) {
    let reduceMotion = false;
    if (WINDOW.matchMedia) {
      reduceMotion = WINDOW.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    providers2.missingIconAbstract = function() {
      const gChildren = [];
      const FILL = {
        fill: "currentColor"
      };
      const ANIMATION_BASE = {
        attributeType: "XML",
        repeatCount: "indefinite",
        dur: "2s"
      };
      gChildren.push({
        tag: "path",
        attributes: _objectSpread2$1(_objectSpread2$1({}, FILL), {}, {
          d: "M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"
        })
      });
      const OPACITY_ANIMATE = _objectSpread2$1(_objectSpread2$1({}, ANIMATION_BASE), {}, {
        attributeName: "opacity"
      });
      const dot = {
        tag: "circle",
        attributes: _objectSpread2$1(_objectSpread2$1({}, FILL), {}, {
          cx: "256",
          cy: "364",
          r: "28"
        }),
        children: []
      };
      if (!reduceMotion) {
        dot.children.push({
          tag: "animate",
          attributes: _objectSpread2$1(_objectSpread2$1({}, ANIMATION_BASE), {}, {
            attributeName: "r",
            values: "28;14;28;28;14;28;"
          })
        }, {
          tag: "animate",
          attributes: _objectSpread2$1(_objectSpread2$1({}, OPACITY_ANIMATE), {}, {
            values: "1;0;1;1;0;1;"
          })
        });
      }
      gChildren.push(dot);
      gChildren.push({
        tag: "path",
        attributes: _objectSpread2$1(_objectSpread2$1({}, FILL), {}, {
          opacity: "1",
          d: "M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"
        }),
        children: reduceMotion ? [] : [{
          tag: "animate",
          attributes: _objectSpread2$1(_objectSpread2$1({}, OPACITY_ANIMATE), {}, {
            values: "1;0;0;0;0;1;"
          })
        }]
      });
      if (!reduceMotion) {
        gChildren.push({
          tag: "path",
          attributes: _objectSpread2$1(_objectSpread2$1({}, FILL), {}, {
            opacity: "0",
            d: "M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"
          }),
          children: [{
            tag: "animate",
            attributes: _objectSpread2$1(_objectSpread2$1({}, OPACITY_ANIMATE), {}, {
              values: "0;0;1;1;0;0;"
            })
          }]
        });
      }
      return {
        tag: "g",
        attributes: {
          "class": "missing"
        },
        children: gChildren
      };
    };
  }
};
var SvgSymbols = {
  hooks() {
    return {
      parseNodeAttributes(accumulator, node) {
        const symbolData = node.getAttribute("data-fa-symbol");
        const symbol = symbolData === null ? false : symbolData === "" ? true : symbolData;
        accumulator["symbol"] = symbol;
        return accumulator;
      }
    };
  }
};
var plugins = [InjectCSS, ReplaceElements, Layers, LayersCounter, LayersText, PseudoElements, MutationObserver$1, PowerTransforms, Masks, MissingIconIndicator, SvgSymbols];
registerPlugins(plugins, {
  mixoutsTo: api
});
api.noAuto;
api.config;
api.library;
api.dom;
const parse$1 = api.parse;
api.findIconDefinition;
api.toHtml;
const icon$1 = api.icon;
api.layer;
api.text;
api.counter;
var propTypes = { exports: {} };
var ReactPropTypesSecret$1 = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
var ReactPropTypesSecret_1 = ReactPropTypesSecret$1;
var ReactPropTypesSecret = ReactPropTypesSecret_1;
function emptyFunction() {
}
function emptyFunctionWithReset() {
}
emptyFunctionWithReset.resetWarningCache = emptyFunction;
var factoryWithThrowingShims = function() {
  function shim(props, propName, componentName, location, propFullName, secret) {
    if (secret === ReactPropTypesSecret) {
      return;
    }
    var err = new Error(
      "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
    );
    err.name = "Invariant Violation";
    throw err;
  }
  shim.isRequired = shim;
  function getShim() {
    return shim;
  }
  var ReactPropTypes = {
    array: shim,
    bigint: shim,
    bool: shim,
    func: shim,
    number: shim,
    object: shim,
    string: shim,
    symbol: shim,
    any: shim,
    arrayOf: getShim,
    element: shim,
    elementType: shim,
    instanceOf: getShim,
    node: shim,
    objectOf: getShim,
    oneOf: getShim,
    oneOfType: getShim,
    shape: getShim,
    exact: getShim,
    checkPropTypes: emptyFunctionWithReset,
    resetWarningCache: emptyFunction
  };
  ReactPropTypes.PropTypes = ReactPropTypes;
  return ReactPropTypes;
};
{
  propTypes.exports = factoryWithThrowingShims();
}
var propTypesExports = propTypes.exports;
const PropTypes = /* @__PURE__ */ getDefaultExportFromCjs(propTypesExports);
var define_process_env_default = {};
function _arrayLikeToArray(r2, a2) {
  (null == a2 || a2 > r2.length) && (a2 = r2.length);
  for (var e = 0, n2 = Array(a2); e < a2; e++) n2[e] = r2[e];
  return n2;
}
function _arrayWithHoles(r2) {
  if (Array.isArray(r2)) return r2;
}
function _arrayWithoutHoles(r2) {
  if (Array.isArray(r2)) return _arrayLikeToArray(r2);
}
function _defineProperty(e, r2, t2) {
  return (r2 = _toPropertyKey(r2)) in e ? Object.defineProperty(e, r2, {
    value: t2,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r2] = t2, e;
}
function _iterableToArray(r2) {
  if ("undefined" != typeof Symbol && null != r2[Symbol.iterator] || null != r2["@@iterator"]) return Array.from(r2);
}
function _iterableToArrayLimit(r2, l2) {
  var t2 = null == r2 ? null : "undefined" != typeof Symbol && r2[Symbol.iterator] || r2["@@iterator"];
  if (null != t2) {
    var e, n2, i2, u2, a2 = [], f2 = true, o2 = false;
    try {
      if (i2 = (t2 = t2.call(r2)).next, 0 === l2) ;
      else for (; !(f2 = (e = i2.call(t2)).done) && (a2.push(e.value), a2.length !== l2); f2 = true) ;
    } catch (r22) {
      o2 = true, n2 = r22;
    } finally {
      try {
        if (!f2 && null != t2.return && (u2 = t2.return(), Object(u2) !== u2)) return;
      } finally {
        if (o2) throw n2;
      }
    }
    return a2;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e, r2) {
  var t2 = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o2 = Object.getOwnPropertySymbols(e);
    r2 && (o2 = o2.filter(function(r22) {
      return Object.getOwnPropertyDescriptor(e, r22).enumerable;
    })), t2.push.apply(t2, o2);
  }
  return t2;
}
function _objectSpread2(e) {
  for (var r2 = 1; r2 < arguments.length; r2++) {
    var t2 = null != arguments[r2] ? arguments[r2] : {};
    r2 % 2 ? ownKeys(Object(t2), true).forEach(function(r22) {
      _defineProperty(e, r22, t2[r22]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t2)) : ownKeys(Object(t2)).forEach(function(r22) {
      Object.defineProperty(e, r22, Object.getOwnPropertyDescriptor(t2, r22));
    });
  }
  return e;
}
function _objectWithoutProperties(e, t2) {
  if (null == e) return {};
  var o2, r2, i2 = _objectWithoutPropertiesLoose(e, t2);
  if (Object.getOwnPropertySymbols) {
    var n2 = Object.getOwnPropertySymbols(e);
    for (r2 = 0; r2 < n2.length; r2++) o2 = n2[r2], -1 === t2.indexOf(o2) && {}.propertyIsEnumerable.call(e, o2) && (i2[o2] = e[o2]);
  }
  return i2;
}
function _objectWithoutPropertiesLoose(r2, e) {
  if (null == r2) return {};
  var t2 = {};
  for (var n2 in r2) if ({}.hasOwnProperty.call(r2, n2)) {
    if (-1 !== e.indexOf(n2)) continue;
    t2[n2] = r2[n2];
  }
  return t2;
}
function _slicedToArray(r2, e) {
  return _arrayWithHoles(r2) || _iterableToArrayLimit(r2, e) || _unsupportedIterableToArray(r2, e) || _nonIterableRest();
}
function _toConsumableArray(r2) {
  return _arrayWithoutHoles(r2) || _iterableToArray(r2) || _unsupportedIterableToArray(r2) || _nonIterableSpread();
}
function _toPrimitive(t2, r2) {
  if ("object" != typeof t2 || !t2) return t2;
  var e = t2[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i2 = e.call(t2, r2);
    if ("object" != typeof i2) return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r2 ? String : Number)(t2);
}
function _toPropertyKey(t2) {
  var i2 = _toPrimitive(t2, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
function _typeof(o2) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o22) {
    return typeof o22;
  } : function(o22) {
    return o22 && "function" == typeof Symbol && o22.constructor === Symbol && o22 !== Symbol.prototype ? "symbol" : typeof o22;
  }, _typeof(o2);
}
function _unsupportedIterableToArray(r2, a2) {
  if (r2) {
    if ("string" == typeof r2) return _arrayLikeToArray(r2, a2);
    var t2 = {}.toString.call(r2).slice(8, -1);
    return "Object" === t2 && r2.constructor && (t2 = r2.constructor.name), "Map" === t2 || "Set" === t2 ? Array.from(r2) : "Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2) ? _arrayLikeToArray(r2, a2) : void 0;
  }
}
var ICON_PACKS_STARTING_VERSION = "7.0.0";
var SVG_CORE_VERSION;
try {
  var svgCorePackageJson = require("@fortawesome/fontawesome-svg-core/package.json");
  SVG_CORE_VERSION = svgCorePackageJson.version;
} catch (e) {
  SVG_CORE_VERSION = typeof process !== "undefined" && define_process_env_default.FA_VERSION || "7.0.0";
}
function classList(props) {
  var beat = props.beat, fade = props.fade, beatFade = props.beatFade, bounce = props.bounce, shake = props.shake, flash = props.flash, spin = props.spin, spinPulse = props.spinPulse, spinReverse = props.spinReverse, pulse = props.pulse, fixedWidth = props.fixedWidth, inverse = props.inverse, border = props.border, listItem = props.listItem, flip = props.flip, size = props.size, rotation = props.rotation, pull = props.pull, swapOpacity = props.swapOpacity, rotateBy = props.rotateBy, widthAuto = props.widthAuto;
  var isVersion7OrLater = versionCheckGte(SVG_CORE_VERSION, ICON_PACKS_STARTING_VERSION);
  var classes = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({
    "fa-beat": beat,
    "fa-fade": fade,
    "fa-beat-fade": beatFade,
    "fa-bounce": bounce,
    "fa-shake": shake,
    "fa-flash": flash,
    "fa-spin": spin,
    "fa-spin-reverse": spinReverse,
    "fa-spin-pulse": spinPulse,
    "fa-pulse": pulse,
    "fa-fw": fixedWidth,
    "fa-inverse": inverse,
    "fa-border": border,
    "fa-li": listItem,
    "fa-flip": flip === true,
    "fa-flip-horizontal": flip === "horizontal" || flip === "both",
    "fa-flip-vertical": flip === "vertical" || flip === "both"
  }, "fa-".concat(size), typeof size !== "undefined" && size !== null), "fa-rotate-".concat(rotation), typeof rotation !== "undefined" && rotation !== null && rotation !== 0), "fa-pull-".concat(pull), typeof pull !== "undefined" && pull !== null), "fa-swap-opacity", swapOpacity), "fa-rotate-by", isVersion7OrLater && rotateBy), "fa-width-auto", isVersion7OrLater && widthAuto);
  return Object.keys(classes).map(function(key) {
    return classes[key] ? key : null;
  }).filter(function(key) {
    return key;
  });
}
function versionCheckGte(version1, version2) {
  var _version1$split = version1.split("-"), _version1$split2 = _slicedToArray(_version1$split, 2), v1Base = _version1$split2[0], v1PreRelease = _version1$split2[1];
  var _version2$split = version2.split("-"), _version2$split2 = _slicedToArray(_version2$split, 2), v2Base = _version2$split2[0], v2PreRelease = _version2$split2[1];
  var v1Parts = v1Base.split(".");
  var v2Parts = v2Base.split(".");
  for (var i2 = 0; i2 < Math.max(v1Parts.length, v2Parts.length); i2++) {
    var v1Part = v1Parts[i2] || "0";
    var v2Part = v2Parts[i2] || "0";
    var v1Num = parseInt(v1Part, 10);
    var v2Num = parseInt(v2Part, 10);
    if (v1Num !== v2Num) {
      return v1Num > v2Num;
    }
  }
  for (var _i = 0; _i < Math.max(v1Parts.length, v2Parts.length); _i++) {
    var _v1Part = v1Parts[_i] || "0";
    var _v2Part = v2Parts[_i] || "0";
    if (_v1Part !== _v2Part) {
      if (_v1Part.length !== _v2Part.length) {
        return _v1Part.length < _v2Part.length;
      }
    }
  }
  if (v1PreRelease && !v2PreRelease) return false;
  if (!v1PreRelease && v2PreRelease) return true;
  return true;
}
function _isNumerical(obj) {
  obj = obj - 0;
  return obj === obj;
}
function camelize(string) {
  if (_isNumerical(string)) {
    return string;
  }
  string = string.replace(/[\-_\s]+(.)?/g, function(match, chr) {
    return chr ? chr.toUpperCase() : "";
  });
  return string.substr(0, 1).toLowerCase() + string.substr(1);
}
var _excluded = ["style"];
function capitalize(val) {
  return val.charAt(0).toUpperCase() + val.slice(1);
}
function styleToObject(style) {
  return style.split(";").map(function(s2) {
    return s2.trim();
  }).filter(function(s2) {
    return s2;
  }).reduce(function(acc, pair) {
    var i2 = pair.indexOf(":");
    var prop = camelize(pair.slice(0, i2));
    var value = pair.slice(i2 + 1).trim();
    prop.startsWith("webkit") ? acc[capitalize(prop)] = value : acc[prop] = value;
    return acc;
  }, {});
}
function convert(createElement2, element) {
  var extraProps = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (typeof element === "string") {
    return element;
  }
  var children = (element.children || []).map(function(child) {
    return convert(createElement2, child);
  });
  var mixins = Object.keys(element.attributes || {}).reduce(function(acc, key) {
    var val = element.attributes[key];
    switch (key) {
      case "class":
        acc.attrs["className"] = val;
        delete element.attributes["class"];
        break;
      case "style":
        acc.attrs["style"] = styleToObject(val);
        break;
      default:
        if (key.indexOf("aria-") === 0 || key.indexOf("data-") === 0) {
          acc.attrs[key.toLowerCase()] = val;
        } else {
          acc.attrs[camelize(key)] = val;
        }
    }
    return acc;
  }, {
    attrs: {}
  });
  var _extraProps$style = extraProps.style, existingStyle = _extraProps$style === void 0 ? {} : _extraProps$style, remaining = _objectWithoutProperties(extraProps, _excluded);
  mixins.attrs["style"] = _objectSpread2(_objectSpread2({}, mixins.attrs["style"]), existingStyle);
  return createElement2.apply(void 0, [element.tag, _objectSpread2(_objectSpread2({}, mixins.attrs), remaining)].concat(_toConsumableArray(children)));
}
var PRODUCTION = false;
try {
  PRODUCTION = true;
} catch (e) {
}
function log() {
  if (!PRODUCTION && console && typeof console.error === "function") {
    var _console;
    (_console = console).error.apply(_console, arguments);
  }
}
function normalizeIconArgs(icon2) {
  if (icon2 && _typeof(icon2) === "object" && icon2.prefix && icon2.iconName && icon2.icon) {
    return icon2;
  }
  if (parse$1.icon) {
    return parse$1.icon(icon2);
  }
  if (icon2 === null) {
    return null;
  }
  if (icon2 && _typeof(icon2) === "object" && icon2.prefix && icon2.iconName) {
    return icon2;
  }
  if (Array.isArray(icon2) && icon2.length === 2) {
    return {
      prefix: icon2[0],
      iconName: icon2[1]
    };
  }
  if (typeof icon2 === "string") {
    return {
      prefix: "fas",
      iconName: icon2
    };
  }
}
function objectWithKey(key, value) {
  return Array.isArray(value) && value.length > 0 || !Array.isArray(value) && value ? _defineProperty({}, key, value) : {};
}
var defaultProps = {
  border: false,
  className: "",
  mask: null,
  maskId: null,
  // the fixedWidth property has been deprecated as of version 7
  fixedWidth: false,
  inverse: false,
  flip: false,
  icon: null,
  listItem: false,
  pull: null,
  pulse: false,
  rotation: null,
  rotateBy: false,
  size: null,
  spin: false,
  spinPulse: false,
  spinReverse: false,
  beat: false,
  fade: false,
  beatFade: false,
  bounce: false,
  shake: false,
  symbol: false,
  title: "",
  titleId: null,
  transform: null,
  swapOpacity: false,
  widthAuto: false
};
var FontAwesomeIcon = /* @__PURE__ */ React__default.forwardRef(function(props, ref) {
  var allProps = _objectSpread2(_objectSpread2({}, defaultProps), props);
  var iconArgs = allProps.icon, maskArgs = allProps.mask, symbol = allProps.symbol, className = allProps.className, title = allProps.title, titleId = allProps.titleId, maskId = allProps.maskId;
  var iconLookup = normalizeIconArgs(iconArgs);
  var classes = objectWithKey("classes", [].concat(_toConsumableArray(classList(allProps)), _toConsumableArray((className || "").split(" "))));
  var transform = objectWithKey("transform", typeof allProps.transform === "string" ? parse$1.transform(allProps.transform) : allProps.transform);
  var mask = objectWithKey("mask", normalizeIconArgs(maskArgs));
  var renderedIcon = icon$1(iconLookup, _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, classes), transform), mask), {}, {
    symbol,
    title,
    titleId,
    maskId
  }));
  if (!renderedIcon) {
    log("Could not find icon", iconLookup);
    return null;
  }
  var abstract = renderedIcon.abstract;
  var extraProps = {
    ref
  };
  Object.keys(allProps).forEach(function(key) {
    if (!defaultProps.hasOwnProperty(key)) {
      extraProps[key] = allProps[key];
    }
  });
  return convertCurry(abstract[0], extraProps);
});
FontAwesomeIcon.displayName = "FontAwesomeIcon";
FontAwesomeIcon.propTypes = {
  beat: PropTypes.bool,
  border: PropTypes.bool,
  beatFade: PropTypes.bool,
  bounce: PropTypes.bool,
  className: PropTypes.string,
  fade: PropTypes.bool,
  flash: PropTypes.bool,
  mask: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]),
  maskId: PropTypes.string,
  // the fixedWidth property has been deprecated as of version 7
  fixedWidth: PropTypes.bool,
  inverse: PropTypes.bool,
  flip: PropTypes.oneOf([true, false, "horizontal", "vertical", "both"]),
  icon: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]),
  listItem: PropTypes.bool,
  pull: PropTypes.oneOf(["right", "left"]),
  pulse: PropTypes.bool,
  rotation: PropTypes.oneOf([0, 90, 180, 270]),
  rotateBy: PropTypes.bool,
  shake: PropTypes.bool,
  size: PropTypes.oneOf(["2xs", "xs", "sm", "lg", "xl", "2xl", "1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]),
  spin: PropTypes.bool,
  spinPulse: PropTypes.bool,
  spinReverse: PropTypes.bool,
  symbol: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  title: PropTypes.string,
  titleId: PropTypes.string,
  transform: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  swapOpacity: PropTypes.bool,
  widthAuto: PropTypes.bool
};
var convertCurry = convert.bind(null, React__default.createElement);
const p$1 = "H1Zdq", u$1 = "mPrth", a = "RN1oz", f$1 = "EsJi3", d$1 = "htk1z", l$1 = "JJet3";
const s$1 = reactExports.forwardRef(
  ({ className: t2, error: n2 = false, fullWidth: o2 = false, ...r2 }, i2) => /* @__PURE__ */ reactExports.createElement(
    "input",
    {
      ref: i2,
      className: clsx(
        p$1,
        {
          [u$1]: n2,
          [l$1]: o2
        },
        t2
      ),
      ...r2
    }
  )
);
s$1.displayName = "Input";
const m$1 = reactExports.forwardRef(
  ({ className: t2, ...n2 }, o2) => /* @__PURE__ */ reactExports.createElement("div", { ref: o2, className: clsx(a, t2), ...n2 })
);
m$1.displayName = "Input.Group";
const I$1 = reactExports.forwardRef(
  ({ className: t2, ...n2 }, o2) => {
    const r2 = typeof n2.onClick != "undefined" || // 'onKeyPress' is deprecated. https://github.com/facebook/react/issues/25888
    typeof n2.onKeyUp != "undefined" || typeof n2.onKeyDown != "undefined" || typeof n2.tabIndex != "undefined" || typeof n2.role != "undefined";
    return /* @__PURE__ */ reactExports.createElement(
      "span",
      {
        ref: o2,
        className: clsx(f$1, { [d$1]: r2 }, t2),
        ...n2
      }
    );
  }
);
I$1.displayName = "Input.Icon";
/*!
 * Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com
 * License - https://fontawesome.com/license (Commercial License)
 * Copyright 2024 Fonticons, Inc.
 */
const faMagnifyingGlass = {
  prefix: "far",
  iconName: "magnifying-glass",
  icon: [512, 512, [128269, "search"], "f002", "M368 208A160 160 0 1 0 48 208a160 160 0 1 0 320 0zM337.1 371.1C301.7 399.2 256.8 416 208 416C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208c0 48.8-16.8 93.7-44.9 129.1L505 471c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0L337.1 371.1z"]
};
const faSearch = faMagnifyingGlass;
var DealRating$2 = /* @__PURE__ */ ((DealRating2) => {
  DealRating2[DealRating2["GREAT"] = 0] = "GREAT";
  DealRating2[DealRating2["GOOD"] = 1] = "GOOD";
  DealRating2[DealRating2["OK"] = 2] = "OK";
  DealRating2[DealRating2["NA"] = 3] = "NA";
  DealRating2[DealRating2["FAIR"] = 4] = "FAIR";
  DealRating2[DealRating2["OUTLIER"] = 5] = "OUTLIER";
  DealRating2[DealRating2["POOR"] = 6] = "POOR";
  DealRating2[DealRating2["OVERPRICED"] = 7] = "OVERPRICED";
  return DealRating2;
})(DealRating$2 || {});
const mapDealRatingFromPriceDto = (ratingPriceDto) => {
  switch (ratingPriceDto) {
    case "GREAT_PRICE": {
      return DealRating$2.GREAT;
    }
    case "GOOD_PRICE": {
      return DealRating$2.GOOD;
    }
    case "OK_PRICE": {
      return DealRating$2.OK;
    }
    case "FAIR_PRICE": {
      return DealRating$2.FAIR;
    }
    case "OUTLIER": {
      return DealRating$2.OUTLIER;
    }
    case "OVERPRICED": {
      return DealRating$2.OVERPRICED;
    }
    case "POOR_PRICE": {
      return DealRating$2.POOR;
    }
    case "NA": {
      return DealRating$2.NA;
    }
    default: {
      return DealRating$2.NA;
    }
  }
};
const mapDealRatingToPriceDto = (rating) => {
  switch (rating) {
    case DealRating$2.GREAT: {
      return "GREAT_PRICE";
    }
    case DealRating$2.GOOD: {
      return "GOOD_PRICE";
    }
    case DealRating$2.OK: {
      return "OK_PRICE";
    }
    case DealRating$2.FAIR: {
      return "FAIR_PRICE";
    }
    case DealRating$2.OUTLIER: {
      return "OUTLIER";
    }
    case DealRating$2.OVERPRICED: {
      return "OVERPRICED";
    }
    case DealRating$2.POOR: {
      return "POOR_PRICE";
    }
    case DealRating$2.NA: {
      return "NA";
    }
    default: {
      return "NA";
    }
  }
};
const enRatings = {
  FAIR: "Fair Deal",
  GOOD: "Good Deal",
  GREAT: "Great Deal",
  HIGH: "High Priced",
  NONE: "No Rating",
  OVERPRICED: "Overpriced",
  UNCERTAIN: "Uncertain"
};
const esRatings = {
  FAIR: "Precio Justo",
  GOOD: "Buen Descuento",
  GREAT: "Gran Descuento",
  HIGH: "Precio Alto",
  NONE: "Sin Evaluar",
  OVERPRICED: "Caro",
  UNCERTAIN: "Incierto"
};
const frRatings = {
  FAIR: "Affaire Èquitable",
  GOOD: "Bonne Affaire",
  GREAT: "Affaire Formidable",
  HIGH: "Prix Èlevè",
  NONE: "Pas De Notation",
  OVERPRICED: "Trop Cher",
  UNCERTAIN: "Incertain"
};
const RatingTranslations = {
  en: enRatings,
  es: esRatings,
  fr: frRatings
};
function getLanguageFromLocale(locale) {
  return locale.slice(0, 2);
}
function getTranslation(locale, rating) {
  return RatingTranslations[getLanguageFromLocale(locale)][rating];
}
function transformRating(rating) {
  return rating.toLowerCase();
}
const dealRating = "POtjH";
const question = "SFtKS";
const icon = "_8lIk6";
const fair = "VBmE3";
const good = "mCIng";
const great = "SwMdU";
const high = "EfUlJ";
const none = "aLJdc";
const overpriced = "_7iwfb";
const uncertain = "cEjPp";
const description = "PhGkm";
const label$1 = "-qMMA";
const DealRating_module = {
  dealRating,
  question,
  icon,
  fair,
  good,
  great,
  high,
  none,
  overpriced,
  uncertain,
  description,
  label: label$1
};
const styles = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  dealRating,
  default: DealRating_module,
  description,
  fair,
  good,
  great,
  high,
  icon,
  label: label$1,
  none,
  overpriced,
  question,
  uncertain
}, Symbol.toStringTag, { value: "Module" }));
const DealRating$1 = reactExports.forwardRef(
  ({ className, description: description$1, locale = "en_US", rating, showLabel = true, ...rest }, ref) => {
    const ratingClassname = transformRating(rating);
    return /* @__PURE__ */ reactExports.createElement("section", { ref, className: clsx(dealRating, className), ...rest }, /* @__PURE__ */ reactExports.createElement(
      "span",
      {
        role: "img",
        "aria-hidden": "true",
        className: clsx(icon, styles[ratingClassname])
      }
    ), showLabel && /* @__PURE__ */ reactExports.createElement("div", null, /* @__PURE__ */ reactExports.createElement("span", { className: clsx(label$1, styles[ratingClassname]) }, getTranslation(locale, rating)), description$1 && /* @__PURE__ */ reactExports.createElement("span", { className: clsx(description) }, description$1)));
  }
);
DealRating$1.displayName = "DealRating";
React__default.forwardRef(
  ({
    label: label2,
    labelClassName,
    groupProps = {},
    preIcon,
    preIconProps = {},
    postIcon,
    postIconProps = {},
    showPostIconOnValue = true,
    wrapperClassName,
    ...props
  }, ref) => {
    const showPostIcon = postIcon && (showPostIconOnValue ? !!props.value : true);
    return /* @__PURE__ */ React__default.createElement("div", { className: wrapperClassName }, label2 && /* @__PURE__ */ React__default.createElement(Label$1, { error: props.error, className: labelClassName, htmlFor: props.id }, label2), /* @__PURE__ */ React__default.createElement(m$1, { ...groupProps }, preIcon && /* @__PURE__ */ React__default.createElement(I$1, { ...preIconProps }, /* @__PURE__ */ React__default.createElement(FontAwesomeIcon, { icon: preIcon })), /* @__PURE__ */ React__default.createElement(s$1, { ref, ...props }), showPostIcon && /* @__PURE__ */ React__default.createElement(I$1, { ...postIconProps }, /* @__PURE__ */ React__default.createElement(FontAwesomeIcon, { icon: postIcon }))));
  }
);
React__default.createContext(void 0);
reactExports.createContext(void 0);
function _extends$1() {
  return _extends$1 = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var t2 = arguments[e2];
      for (var r2 in t2) ({}).hasOwnProperty.call(t2, r2) && (n2[r2] = t2[r2]);
    }
    return n2;
  }, _extends$1.apply(null, arguments);
}
function $e42e1063c40fb3ef$export$b9ecd428b558ff10(originalEventHandler, ourEventHandler, { checkForDefaultPrevented = true } = {}) {
  return function handleEvent(event) {
    originalEventHandler === null || originalEventHandler === void 0 || originalEventHandler(event);
    if (checkForDefaultPrevented === false || !event.defaultPrevented) return ourEventHandler === null || ourEventHandler === void 0 ? void 0 : ourEventHandler(event);
  };
}
function $6ed0406888f73fc4$var$setRef$1(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref !== null && ref !== void 0) ref.current = value;
}
function $6ed0406888f73fc4$export$43e446d32b3d21af$1(...refs) {
  return (node) => refs.forEach(
    (ref) => $6ed0406888f73fc4$var$setRef$1(ref, node)
  );
}
function $6ed0406888f73fc4$export$c7b2cbe3552a0d05(...refs) {
  return reactExports.useCallback($6ed0406888f73fc4$export$43e446d32b3d21af$1(...refs), refs);
}
function $c512c27ab02ef895$export$50c7b4e9d9f19c1(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function $c512c27ab02ef895$export$fd42f52fd3ae1109(rootComponentName, defaultContext) {
    const BaseContext = /* @__PURE__ */ reactExports.createContext(defaultContext);
    const index = defaultContexts.length;
    defaultContexts = [
      ...defaultContexts,
      defaultContext
    ];
    function Provider(props) {
      const { scope: scope2, children, ...context } = props;
      const Context2 = (scope2 === null || scope2 === void 0 ? void 0 : scope2[scopeName][index]) || BaseContext;
      const value = reactExports.useMemo(
        () => context,
        Object.values(context)
      );
      return /* @__PURE__ */ reactExports.createElement(Context2.Provider, {
        value
      }, children);
    }
    function useContext$1(consumerName, scope2) {
      const Context2 = (scope2 === null || scope2 === void 0 ? void 0 : scope2[scopeName][index]) || BaseContext;
      const context = reactExports.useContext(Context2);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    Provider.displayName = rootComponentName + "Provider";
    return [
      Provider,
      useContext$1
    ];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return /* @__PURE__ */ reactExports.createContext(defaultContext);
    });
    return function useScope(scope2) {
      const contexts = (scope2 === null || scope2 === void 0 ? void 0 : scope2[scopeName]) || scopeContexts;
      return reactExports.useMemo(
        () => ({
          [`__scope${scopeName}`]: {
            ...scope2,
            [scopeName]: contexts
          }
        }),
        [
          scope2,
          contexts
        ]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [
    $c512c27ab02ef895$export$fd42f52fd3ae1109,
    $c512c27ab02ef895$var$composeContextScopes(createScope, ...createContextScopeDeps)
  ];
}
function $c512c27ab02ef895$var$composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope1 = () => {
    const scopeHooks = scopes.map(
      (createScope) => ({
        useScope: createScope(),
        scopeName: createScope.scopeName
      })
    );
    return function useComposedScopes(overrideScopes) {
      const nextScopes1 = scopeHooks.reduce((nextScopes, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return {
          ...nextScopes,
          ...currentScope
        };
      }, {});
      return reactExports.useMemo(
        () => ({
          [`__scope${baseScope.scopeName}`]: nextScopes1
        }),
        [
          nextScopes1
        ]
      );
    };
  };
  createScope1.scopeName = baseScope.scopeName;
  return createScope1;
}
const $5e63c961fc1ce211$export$8c6ed5c666ac1360$1 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const childrenArray = reactExports.Children.toArray(children);
  const slottable = childrenArray.find($5e63c961fc1ce211$var$isSlottable$1);
  if (slottable) {
    const newElement = slottable.props.children;
    const newChildren = childrenArray.map((child) => {
      if (child === slottable) {
        if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
        return /* @__PURE__ */ reactExports.isValidElement(newElement) ? newElement.props.children : null;
      } else return child;
    });
    return /* @__PURE__ */ reactExports.createElement($5e63c961fc1ce211$var$SlotClone$1, _extends$1({}, slotProps, {
      ref: forwardedRef
    }), /* @__PURE__ */ reactExports.isValidElement(newElement) ? /* @__PURE__ */ reactExports.cloneElement(newElement, void 0, newChildren) : null);
  }
  return /* @__PURE__ */ reactExports.createElement($5e63c961fc1ce211$var$SlotClone$1, _extends$1({}, slotProps, {
    ref: forwardedRef
  }), children);
});
$5e63c961fc1ce211$export$8c6ed5c666ac1360$1.displayName = "Slot";
const $5e63c961fc1ce211$var$SlotClone$1 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  if (/* @__PURE__ */ reactExports.isValidElement(children)) return /* @__PURE__ */ reactExports.cloneElement(children, {
    ...$5e63c961fc1ce211$var$mergeProps$1(slotProps, children.props),
    ref: forwardedRef ? $6ed0406888f73fc4$export$43e446d32b3d21af$1(forwardedRef, children.ref) : children.ref
  });
  return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
});
$5e63c961fc1ce211$var$SlotClone$1.displayName = "SlotClone";
const $5e63c961fc1ce211$export$d9f1ccf0bdb05d45$1 = ({ children }) => {
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, children);
};
function $5e63c961fc1ce211$var$isSlottable$1(child) {
  return /* @__PURE__ */ reactExports.isValidElement(child) && child.type === $5e63c961fc1ce211$export$d9f1ccf0bdb05d45$1;
}
function $5e63c961fc1ce211$var$mergeProps$1(slotProps, childProps) {
  const overrideProps = {
    ...childProps
  };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) overrideProps[propName] = (...args) => {
        childPropValue(...args);
        slotPropValue(...args);
      };
      else if (slotPropValue) overrideProps[propName] = slotPropValue;
    } else if (propName === "style") overrideProps[propName] = {
      ...slotPropValue,
      ...childPropValue
    };
    else if (propName === "className") overrideProps[propName] = [
      slotPropValue,
      childPropValue
    ].filter(Boolean).join(" ");
  }
  return {
    ...slotProps,
    ...overrideProps
  };
}
const $8927f6f2acc4f386$var$NODES$1 = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "span",
  "svg",
  "ul"
];
const $8927f6f2acc4f386$export$250ffa63cdc0d034$1 = $8927f6f2acc4f386$var$NODES$1.reduce((primitive, node) => {
  const Node2 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? $5e63c961fc1ce211$export$8c6ed5c666ac1360$1 : node;
    reactExports.useEffect(() => {
      window[Symbol.for("radix-ui")] = true;
    }, []);
    return /* @__PURE__ */ reactExports.createElement(Comp, _extends$1({}, primitiveProps, {
      ref: forwardedRef
    }));
  });
  Node2.displayName = `Primitive.${node}`;
  return {
    ...primitive,
    [node]: Node2
  };
}, {});
function $e02a7d9cb1dc128c$export$c74125a8e3af6bb2(name) {
  const PROVIDER_NAME = name + "CollectionProvider";
  const [createCollectionContext, createCollectionScope] = $c512c27ab02ef895$export$50c7b4e9d9f19c1(PROVIDER_NAME);
  const [CollectionProviderImpl, useCollectionContext] = createCollectionContext(PROVIDER_NAME, {
    collectionRef: {
      current: null
    },
    itemMap: /* @__PURE__ */ new Map()
  });
  const CollectionProvider = (props) => {
    const { scope: scope2, children } = props;
    const ref = React__default.useRef(null);
    const itemMap = React__default.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ React__default.createElement(CollectionProviderImpl, {
      scope: scope2,
      itemMap,
      collectionRef: ref
    }, children);
  };
  const COLLECTION_SLOT_NAME = name + "CollectionSlot";
  const CollectionSlot = /* @__PURE__ */ React__default.forwardRef((props, forwardedRef) => {
    const { scope: scope2, children } = props;
    const context = useCollectionContext(COLLECTION_SLOT_NAME, scope2);
    const composedRefs = $6ed0406888f73fc4$export$c7b2cbe3552a0d05(forwardedRef, context.collectionRef);
    return /* @__PURE__ */ React__default.createElement($5e63c961fc1ce211$export$8c6ed5c666ac1360$1, {
      ref: composedRefs
    }, children);
  });
  const ITEM_SLOT_NAME = name + "CollectionItemSlot";
  const ITEM_DATA_ATTR = "data-radix-collection-item";
  const CollectionItemSlot = /* @__PURE__ */ React__default.forwardRef((props, forwardedRef) => {
    const { scope: scope2, children, ...itemData } = props;
    const ref = React__default.useRef(null);
    const composedRefs = $6ed0406888f73fc4$export$c7b2cbe3552a0d05(forwardedRef, ref);
    const context = useCollectionContext(ITEM_SLOT_NAME, scope2);
    React__default.useEffect(() => {
      context.itemMap.set(ref, {
        ref,
        ...itemData
      });
      return () => void context.itemMap.delete(ref);
    });
    return /* @__PURE__ */ React__default.createElement($5e63c961fc1ce211$export$8c6ed5c666ac1360$1, {
      [ITEM_DATA_ATTR]: "",
      ref: composedRefs
    }, children);
  });
  function useCollection(scope2) {
    const context = useCollectionContext(name + "CollectionConsumer", scope2);
    const getItems = React__default.useCallback(() => {
      const collectionNode = context.collectionRef.current;
      if (!collectionNode) return [];
      const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
      const items = Array.from(context.itemMap.values());
      const orderedItems = items.sort(
        (a2, b) => orderedNodes.indexOf(a2.ref.current) - orderedNodes.indexOf(b.ref.current)
      );
      return orderedItems;
    }, [
      context.collectionRef,
      context.itemMap
    ]);
    return getItems;
  }
  return [
    {
      Provider: CollectionProvider,
      Slot: CollectionSlot,
      ItemSlot: CollectionItemSlot
    },
    useCollection,
    createCollectionScope
  ];
}
const $9f79659886946c16$export$e5c5a5f917a5871c = Boolean(globalThis === null || globalThis === void 0 ? void 0 : globalThis.document) ? reactExports.useLayoutEffect : () => {
};
const $1746a345f3d73bb7$var$useReactId = React["useId".toString()] || (() => void 0);
let $1746a345f3d73bb7$var$count = 0;
function $1746a345f3d73bb7$export$f680877a34711e37(deterministicId) {
  const [id2, setId] = reactExports.useState($1746a345f3d73bb7$var$useReactId());
  $9f79659886946c16$export$e5c5a5f917a5871c(() => {
    setId(
      (reactId) => reactId !== null && reactId !== void 0 ? reactId : String($1746a345f3d73bb7$var$count++)
    );
  }, [
    deterministicId
  ]);
  return deterministicId || (id2 ? `radix-${id2}` : "");
}
function $b1b2314f5f9a1d84$export$25bec8c6f54ee79a(callback) {
  const callbackRef = reactExports.useRef(callback);
  reactExports.useEffect(() => {
    callbackRef.current = callback;
  });
  return reactExports.useMemo(
    () => (...args) => {
      var _callbackRef$current;
      return (_callbackRef$current = callbackRef.current) === null || _callbackRef$current === void 0 ? void 0 : _callbackRef$current.call(callbackRef, ...args);
    },
    []
  );
}
function $71cd76cc60e0454e$export$6f32135080cb4c3({ prop, defaultProp, onChange: onChange2 = () => {
} }) {
  const [uncontrolledProp, setUncontrolledProp] = $71cd76cc60e0454e$var$useUncontrolledState({
    defaultProp,
    onChange: onChange2
  });
  const isControlled = prop !== void 0;
  const value1 = isControlled ? prop : uncontrolledProp;
  const handleChange = $b1b2314f5f9a1d84$export$25bec8c6f54ee79a(onChange2);
  const setValue = reactExports.useCallback((nextValue) => {
    if (isControlled) {
      const setter = nextValue;
      const value = typeof nextValue === "function" ? setter(prop) : nextValue;
      if (value !== prop) handleChange(value);
    } else setUncontrolledProp(nextValue);
  }, [
    isControlled,
    prop,
    setUncontrolledProp,
    handleChange
  ]);
  return [
    value1,
    setValue
  ];
}
function $71cd76cc60e0454e$var$useUncontrolledState({ defaultProp, onChange: onChange2 }) {
  const uncontrolledState = reactExports.useState(defaultProp);
  const [value] = uncontrolledState;
  const prevValueRef = reactExports.useRef(value);
  const handleChange = $b1b2314f5f9a1d84$export$25bec8c6f54ee79a(onChange2);
  reactExports.useEffect(() => {
    if (prevValueRef.current !== value) {
      handleChange(value);
      prevValueRef.current = value;
    }
  }, [
    value,
    prevValueRef,
    handleChange
  ]);
  return uncontrolledState;
}
const $f631663db3294ace$var$DirectionContext = /* @__PURE__ */ reactExports.createContext(void 0);
function $f631663db3294ace$export$b39126d51d94e6f3(localDir) {
  const globalDir = reactExports.useContext($f631663db3294ace$var$DirectionContext);
  return localDir || globalDir || "ltr";
}
const $d7bdfb9eb0fdf311$var$ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
const $d7bdfb9eb0fdf311$var$EVENT_OPTIONS = {
  bubbles: false,
  cancelable: true
};
const $d7bdfb9eb0fdf311$var$GROUP_NAME = "RovingFocusGroup";
const [$d7bdfb9eb0fdf311$var$Collection, $d7bdfb9eb0fdf311$var$useCollection, $d7bdfb9eb0fdf311$var$createCollectionScope] = $e02a7d9cb1dc128c$export$c74125a8e3af6bb2($d7bdfb9eb0fdf311$var$GROUP_NAME);
const [$d7bdfb9eb0fdf311$var$createRovingFocusGroupContext, $d7bdfb9eb0fdf311$export$c7109489551a4f4] = $c512c27ab02ef895$export$50c7b4e9d9f19c1($d7bdfb9eb0fdf311$var$GROUP_NAME, [
  $d7bdfb9eb0fdf311$var$createCollectionScope
]);
const [$d7bdfb9eb0fdf311$var$RovingFocusProvider, $d7bdfb9eb0fdf311$var$useRovingFocusContext] = $d7bdfb9eb0fdf311$var$createRovingFocusGroupContext($d7bdfb9eb0fdf311$var$GROUP_NAME);
const $d7bdfb9eb0fdf311$export$8699f7c8af148338 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  return /* @__PURE__ */ reactExports.createElement($d7bdfb9eb0fdf311$var$Collection.Provider, {
    scope: props.__scopeRovingFocusGroup
  }, /* @__PURE__ */ reactExports.createElement($d7bdfb9eb0fdf311$var$Collection.Slot, {
    scope: props.__scopeRovingFocusGroup
  }, /* @__PURE__ */ reactExports.createElement($d7bdfb9eb0fdf311$var$RovingFocusGroupImpl, _extends$1({}, props, {
    ref: forwardedRef
  }))));
});
const $d7bdfb9eb0fdf311$var$RovingFocusGroupImpl = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeRovingFocusGroup, orientation, loop = false, dir, currentTabStopId: currentTabStopIdProp, defaultCurrentTabStopId, onCurrentTabStopIdChange, onEntryFocus, ...groupProps } = props;
  const ref = reactExports.useRef(null);
  const composedRefs = $6ed0406888f73fc4$export$c7b2cbe3552a0d05(forwardedRef, ref);
  const direction = $f631663db3294ace$export$b39126d51d94e6f3(dir);
  const [currentTabStopId = null, setCurrentTabStopId] = $71cd76cc60e0454e$export$6f32135080cb4c3({
    prop: currentTabStopIdProp,
    defaultProp: defaultCurrentTabStopId,
    onChange: onCurrentTabStopIdChange
  });
  const [isTabbingBackOut, setIsTabbingBackOut] = reactExports.useState(false);
  const handleEntryFocus = $b1b2314f5f9a1d84$export$25bec8c6f54ee79a(onEntryFocus);
  const getItems = $d7bdfb9eb0fdf311$var$useCollection(__scopeRovingFocusGroup);
  const isClickFocusRef = reactExports.useRef(false);
  const [focusableItemsCount, setFocusableItemsCount] = reactExports.useState(0);
  reactExports.useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener($d7bdfb9eb0fdf311$var$ENTRY_FOCUS, handleEntryFocus);
      return () => node.removeEventListener($d7bdfb9eb0fdf311$var$ENTRY_FOCUS, handleEntryFocus);
    }
  }, [
    handleEntryFocus
  ]);
  return /* @__PURE__ */ reactExports.createElement($d7bdfb9eb0fdf311$var$RovingFocusProvider, {
    scope: __scopeRovingFocusGroup,
    orientation,
    dir: direction,
    loop,
    currentTabStopId,
    onItemFocus: reactExports.useCallback(
      (tabStopId) => setCurrentTabStopId(tabStopId),
      [
        setCurrentTabStopId
      ]
    ),
    onItemShiftTab: reactExports.useCallback(
      () => setIsTabbingBackOut(true),
      []
    ),
    onFocusableItemAdd: reactExports.useCallback(
      () => setFocusableItemsCount(
        (prevCount) => prevCount + 1
      ),
      []
    ),
    onFocusableItemRemove: reactExports.useCallback(
      () => setFocusableItemsCount(
        (prevCount) => prevCount - 1
      ),
      []
    )
  }, /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034$1.div, _extends$1({
    tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
    "data-orientation": orientation
  }, groupProps, {
    ref: composedRefs,
    style: {
      outline: "none",
      ...props.style
    },
    onMouseDown: $e42e1063c40fb3ef$export$b9ecd428b558ff10(props.onMouseDown, () => {
      isClickFocusRef.current = true;
    }),
    onFocus: $e42e1063c40fb3ef$export$b9ecd428b558ff10(props.onFocus, (event) => {
      const isKeyboardFocus = !isClickFocusRef.current;
      if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
        const entryFocusEvent = new CustomEvent($d7bdfb9eb0fdf311$var$ENTRY_FOCUS, $d7bdfb9eb0fdf311$var$EVENT_OPTIONS);
        event.currentTarget.dispatchEvent(entryFocusEvent);
        if (!entryFocusEvent.defaultPrevented) {
          const items = getItems().filter(
            (item2) => item2.focusable
          );
          const activeItem = items.find(
            (item2) => item2.active
          );
          const currentItem = items.find(
            (item2) => item2.id === currentTabStopId
          );
          const candidateItems = [
            activeItem,
            currentItem,
            ...items
          ].filter(Boolean);
          const candidateNodes = candidateItems.map(
            (item2) => item2.ref.current
          );
          $d7bdfb9eb0fdf311$var$focusFirst(candidateNodes);
        }
      }
      isClickFocusRef.current = false;
    }),
    onBlur: $e42e1063c40fb3ef$export$b9ecd428b558ff10(
      props.onBlur,
      () => setIsTabbingBackOut(false)
    )
  })));
});
const $d7bdfb9eb0fdf311$var$ITEM_NAME = "RovingFocusGroupItem";
const $d7bdfb9eb0fdf311$export$ab9df7c53fe8454 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeRovingFocusGroup, focusable = true, active = false, tabStopId, ...itemProps } = props;
  const autoId = $1746a345f3d73bb7$export$f680877a34711e37();
  const id2 = tabStopId || autoId;
  const context = $d7bdfb9eb0fdf311$var$useRovingFocusContext($d7bdfb9eb0fdf311$var$ITEM_NAME, __scopeRovingFocusGroup);
  const isCurrentTabStop = context.currentTabStopId === id2;
  const getItems = $d7bdfb9eb0fdf311$var$useCollection(__scopeRovingFocusGroup);
  const { onFocusableItemAdd, onFocusableItemRemove } = context;
  reactExports.useEffect(() => {
    if (focusable) {
      onFocusableItemAdd();
      return () => onFocusableItemRemove();
    }
  }, [
    focusable,
    onFocusableItemAdd,
    onFocusableItemRemove
  ]);
  return /* @__PURE__ */ reactExports.createElement($d7bdfb9eb0fdf311$var$Collection.ItemSlot, {
    scope: __scopeRovingFocusGroup,
    id: id2,
    focusable,
    active
  }, /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034$1.span, _extends$1({
    tabIndex: isCurrentTabStop ? 0 : -1,
    "data-orientation": context.orientation
  }, itemProps, {
    ref: forwardedRef,
    onMouseDown: $e42e1063c40fb3ef$export$b9ecd428b558ff10(props.onMouseDown, (event) => {
      if (!focusable) event.preventDefault();
      else context.onItemFocus(id2);
    }),
    onFocus: $e42e1063c40fb3ef$export$b9ecd428b558ff10(
      props.onFocus,
      () => context.onItemFocus(id2)
    ),
    onKeyDown: $e42e1063c40fb3ef$export$b9ecd428b558ff10(props.onKeyDown, (event) => {
      if (event.key === "Tab" && event.shiftKey) {
        context.onItemShiftTab();
        return;
      }
      if (event.target !== event.currentTarget) return;
      const focusIntent = $d7bdfb9eb0fdf311$var$getFocusIntent(event, context.orientation, context.dir);
      if (focusIntent !== void 0) {
        event.preventDefault();
        const items = getItems().filter(
          (item2) => item2.focusable
        );
        let candidateNodes = items.map(
          (item2) => item2.ref.current
        );
        if (focusIntent === "last") candidateNodes.reverse();
        else if (focusIntent === "prev" || focusIntent === "next") {
          if (focusIntent === "prev") candidateNodes.reverse();
          const currentIndex = candidateNodes.indexOf(event.currentTarget);
          candidateNodes = context.loop ? $d7bdfb9eb0fdf311$var$wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
        }
        setTimeout(
          () => $d7bdfb9eb0fdf311$var$focusFirst(candidateNodes)
        );
      }
    })
  })));
});
const $d7bdfb9eb0fdf311$var$MAP_KEY_TO_FOCUS_INTENT = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function $d7bdfb9eb0fdf311$var$getDirectionAwareKey(key, dir) {
  if (dir !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
function $d7bdfb9eb0fdf311$var$getFocusIntent(event, orientation, dir) {
  const key = $d7bdfb9eb0fdf311$var$getDirectionAwareKey(event.key, dir);
  if (orientation === "vertical" && [
    "ArrowLeft",
    "ArrowRight"
  ].includes(key)) return void 0;
  if (orientation === "horizontal" && [
    "ArrowUp",
    "ArrowDown"
  ].includes(key)) return void 0;
  return $d7bdfb9eb0fdf311$var$MAP_KEY_TO_FOCUS_INTENT[key];
}
function $d7bdfb9eb0fdf311$var$focusFirst(candidates) {
  const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus();
    if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
function $d7bdfb9eb0fdf311$var$wrapArray(array, startIndex) {
  return array.map(
    (_, index) => array[(startIndex + index) % array.length]
  );
}
const $d7bdfb9eb0fdf311$export$be92b6f5f03c0fe9 = $d7bdfb9eb0fdf311$export$8699f7c8af148338;
const $d7bdfb9eb0fdf311$export$6d08773d2e66f8f2 = $d7bdfb9eb0fdf311$export$ab9df7c53fe8454;
function $db6c3485150b8e66$export$1ab7ae714698c4b8(element) {
  const [size, setSize] = reactExports.useState(void 0);
  $9f79659886946c16$export$e5c5a5f917a5871c(() => {
    if (element) {
      setSize({
        width: element.offsetWidth,
        height: element.offsetHeight
      });
      const resizeObserver = new ResizeObserver((entries) => {
        if (!Array.isArray(entries)) return;
        if (!entries.length) return;
        const entry = entries[0];
        let width;
        let height;
        if ("borderBoxSize" in entry) {
          const borderSizeEntry = entry["borderBoxSize"];
          const borderSize = Array.isArray(borderSizeEntry) ? borderSizeEntry[0] : borderSizeEntry;
          width = borderSize["inlineSize"];
          height = borderSize["blockSize"];
        } else {
          width = element.offsetWidth;
          height = element.offsetHeight;
        }
        setSize({
          width,
          height
        });
      });
      resizeObserver.observe(element, {
        box: "border-box"
      });
      return () => resizeObserver.unobserve(element);
    } else
      setSize(void 0);
  }, [
    element
  ]);
  return size;
}
function $010c2913dbd2fe3d$export$5cae361ad82dce8b(value) {
  const ref = reactExports.useRef({
    value,
    previous: value
  });
  return reactExports.useMemo(() => {
    if (ref.current.value !== value) {
      ref.current.previous = ref.current.value;
      ref.current.value = value;
    }
    return ref.current.previous;
  }, [
    value
  ]);
}
function $fe963b355347cc68$export$3e6543de14f8614f(initialState, machine) {
  return reactExports.useReducer((state, event) => {
    const nextState = machine[state][event];
    return nextState !== null && nextState !== void 0 ? nextState : state;
  }, initialState);
}
const $921a889cee6df7e8$export$99c2b779aa4e8b8b = (props) => {
  const { present, children } = props;
  const presence = $921a889cee6df7e8$var$usePresence(present);
  const child = typeof children === "function" ? children({
    present: presence.isPresent
  }) : reactExports.Children.only(children);
  const ref = $6ed0406888f73fc4$export$c7b2cbe3552a0d05(presence.ref, child.ref);
  const forceMount = typeof children === "function";
  return forceMount || presence.isPresent ? /* @__PURE__ */ reactExports.cloneElement(child, {
    ref
  }) : null;
};
$921a889cee6df7e8$export$99c2b779aa4e8b8b.displayName = "Presence";
function $921a889cee6df7e8$var$usePresence(present) {
  const [node1, setNode] = reactExports.useState();
  const stylesRef = reactExports.useRef({});
  const prevPresentRef = reactExports.useRef(present);
  const prevAnimationNameRef = reactExports.useRef("none");
  const initialState = present ? "mounted" : "unmounted";
  const [state, send] = $fe963b355347cc68$export$3e6543de14f8614f(initialState, {
    mounted: {
      UNMOUNT: "unmounted",
      ANIMATION_OUT: "unmountSuspended"
    },
    unmountSuspended: {
      MOUNT: "mounted",
      ANIMATION_END: "unmounted"
    },
    unmounted: {
      MOUNT: "mounted"
    }
  });
  reactExports.useEffect(() => {
    const currentAnimationName = $921a889cee6df7e8$var$getAnimationName(stylesRef.current);
    prevAnimationNameRef.current = state === "mounted" ? currentAnimationName : "none";
  }, [
    state
  ]);
  $9f79659886946c16$export$e5c5a5f917a5871c(() => {
    const styles2 = stylesRef.current;
    const wasPresent = prevPresentRef.current;
    const hasPresentChanged = wasPresent !== present;
    if (hasPresentChanged) {
      const prevAnimationName = prevAnimationNameRef.current;
      const currentAnimationName = $921a889cee6df7e8$var$getAnimationName(styles2);
      if (present) send("MOUNT");
      else if (currentAnimationName === "none" || (styles2 === null || styles2 === void 0 ? void 0 : styles2.display) === "none")
        send("UNMOUNT");
      else {
        const isAnimating = prevAnimationName !== currentAnimationName;
        if (wasPresent && isAnimating) send("ANIMATION_OUT");
        else send("UNMOUNT");
      }
      prevPresentRef.current = present;
    }
  }, [
    present,
    send
  ]);
  $9f79659886946c16$export$e5c5a5f917a5871c(() => {
    if (node1) {
      const handleAnimationEnd = (event) => {
        const currentAnimationName = $921a889cee6df7e8$var$getAnimationName(stylesRef.current);
        const isCurrentAnimation = currentAnimationName.includes(event.animationName);
        if (event.target === node1 && isCurrentAnimation)
          reactDomExports.flushSync(
            () => send("ANIMATION_END")
          );
      };
      const handleAnimationStart = (event) => {
        if (event.target === node1)
          prevAnimationNameRef.current = $921a889cee6df7e8$var$getAnimationName(stylesRef.current);
      };
      node1.addEventListener("animationstart", handleAnimationStart);
      node1.addEventListener("animationcancel", handleAnimationEnd);
      node1.addEventListener("animationend", handleAnimationEnd);
      return () => {
        node1.removeEventListener("animationstart", handleAnimationStart);
        node1.removeEventListener("animationcancel", handleAnimationEnd);
        node1.removeEventListener("animationend", handleAnimationEnd);
      };
    } else
      send("ANIMATION_END");
  }, [
    node1,
    send
  ]);
  return {
    isPresent: [
      "mounted",
      "unmountSuspended"
    ].includes(state),
    ref: reactExports.useCallback((node) => {
      if (node) stylesRef.current = getComputedStyle(node);
      setNode(node);
    }, [])
  };
}
function $921a889cee6df7e8$var$getAnimationName(styles2) {
  return (styles2 === null || styles2 === void 0 ? void 0 : styles2.animationName) || "none";
}
const $ce77a8961b41be9e$var$RADIO_NAME = "Radio";
const [$ce77a8961b41be9e$var$createRadioContext, $ce77a8961b41be9e$export$67d2296460f1b002] = $c512c27ab02ef895$export$50c7b4e9d9f19c1($ce77a8961b41be9e$var$RADIO_NAME);
const [$ce77a8961b41be9e$var$RadioProvider, $ce77a8961b41be9e$var$useRadioContext] = $ce77a8961b41be9e$var$createRadioContext($ce77a8961b41be9e$var$RADIO_NAME);
const $ce77a8961b41be9e$export$d7b12c4107be0d61 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeRadio, name, checked = false, required: required2, disabled: disabled2, value = "on", onCheck, ...radioProps } = props;
  const [button2, setButton] = reactExports.useState(null);
  const composedRefs = $6ed0406888f73fc4$export$c7b2cbe3552a0d05(
    forwardedRef,
    (node) => setButton(node)
  );
  const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
  const isFormControl = button2 ? Boolean(button2.closest("form")) : true;
  return /* @__PURE__ */ reactExports.createElement($ce77a8961b41be9e$var$RadioProvider, {
    scope: __scopeRadio,
    checked,
    disabled: disabled2
  }, /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034$1.button, _extends$1({
    type: "button",
    role: "radio",
    "aria-checked": checked,
    "data-state": $ce77a8961b41be9e$var$getState(checked),
    "data-disabled": disabled2 ? "" : void 0,
    disabled: disabled2,
    value
  }, radioProps, {
    ref: composedRefs,
    onClick: $e42e1063c40fb3ef$export$b9ecd428b558ff10(props.onClick, (event) => {
      if (!checked) onCheck === null || onCheck === void 0 || onCheck();
      if (isFormControl) {
        hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
        if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
      }
    })
  })), isFormControl && /* @__PURE__ */ reactExports.createElement($ce77a8961b41be9e$var$BubbleInput, {
    control: button2,
    bubbles: !hasConsumerStoppedPropagationRef.current,
    name,
    value,
    checked,
    required: required2,
    disabled: disabled2,
    style: {
      transform: "translateX(-100%)"
    }
  }));
});
const $ce77a8961b41be9e$var$INDICATOR_NAME = "RadioIndicator";
const $ce77a8961b41be9e$export$d35a9ffa9a04f9e7 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeRadio, forceMount, ...indicatorProps } = props;
  const context = $ce77a8961b41be9e$var$useRadioContext($ce77a8961b41be9e$var$INDICATOR_NAME, __scopeRadio);
  return /* @__PURE__ */ reactExports.createElement($921a889cee6df7e8$export$99c2b779aa4e8b8b, {
    present: forceMount || context.checked
  }, /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034$1.span, _extends$1({
    "data-state": $ce77a8961b41be9e$var$getState(context.checked),
    "data-disabled": context.disabled ? "" : void 0
  }, indicatorProps, {
    ref: forwardedRef
  })));
});
const $ce77a8961b41be9e$var$BubbleInput = (props) => {
  const { control, checked, bubbles = true, ...inputProps } = props;
  const ref = reactExports.useRef(null);
  const prevChecked = $010c2913dbd2fe3d$export$5cae361ad82dce8b(checked);
  const controlSize = $db6c3485150b8e66$export$1ab7ae714698c4b8(control);
  reactExports.useEffect(() => {
    const input = ref.current;
    const inputProto = window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(inputProto, "checked");
    const setChecked = descriptor.set;
    if (prevChecked !== checked && setChecked) {
      const event = new Event("click", {
        bubbles
      });
      setChecked.call(input, checked);
      input.dispatchEvent(event);
    }
  }, [
    prevChecked,
    checked,
    bubbles
  ]);
  return /* @__PURE__ */ reactExports.createElement("input", _extends$1({
    type: "radio",
    "aria-hidden": true,
    defaultChecked: checked
  }, inputProps, {
    tabIndex: -1,
    ref,
    style: {
      ...props.style,
      ...controlSize,
      position: "absolute",
      pointerEvents: "none",
      opacity: 0,
      margin: 0
    }
  }));
};
function $ce77a8961b41be9e$var$getState(checked) {
  return checked ? "checked" : "unchecked";
}
const $f99a8c78507165f7$var$ARROW_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight"
];
const $f99a8c78507165f7$var$RADIO_GROUP_NAME = "RadioGroup";
const [$f99a8c78507165f7$var$createRadioGroupContext, $f99a8c78507165f7$export$c547093f11b76da2] = $c512c27ab02ef895$export$50c7b4e9d9f19c1($f99a8c78507165f7$var$RADIO_GROUP_NAME, [
  $d7bdfb9eb0fdf311$export$c7109489551a4f4,
  $ce77a8961b41be9e$export$67d2296460f1b002
]);
const $f99a8c78507165f7$var$useRovingFocusGroupScope = $d7bdfb9eb0fdf311$export$c7109489551a4f4();
const $f99a8c78507165f7$var$useRadioScope = $ce77a8961b41be9e$export$67d2296460f1b002();
const [$f99a8c78507165f7$var$RadioGroupProvider, $f99a8c78507165f7$var$useRadioGroupContext] = $f99a8c78507165f7$var$createRadioGroupContext($f99a8c78507165f7$var$RADIO_GROUP_NAME);
const $f99a8c78507165f7$export$a98f0dcb43a68a25 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeRadioGroup, name, defaultValue, value: valueProp, required: required2 = false, disabled: disabled2 = false, orientation, dir, loop = true, onValueChange, ...groupProps } = props;
  const rovingFocusGroupScope = $f99a8c78507165f7$var$useRovingFocusGroupScope(__scopeRadioGroup);
  const direction = $f631663db3294ace$export$b39126d51d94e6f3(dir);
  const [value, setValue] = $71cd76cc60e0454e$export$6f32135080cb4c3({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange
  });
  return /* @__PURE__ */ reactExports.createElement($f99a8c78507165f7$var$RadioGroupProvider, {
    scope: __scopeRadioGroup,
    name,
    required: required2,
    disabled: disabled2,
    value,
    onValueChange: setValue
  }, /* @__PURE__ */ reactExports.createElement($d7bdfb9eb0fdf311$export$be92b6f5f03c0fe9, _extends$1({
    asChild: true
  }, rovingFocusGroupScope, {
    orientation,
    dir: direction,
    loop
  }), /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034$1.div, _extends$1({
    role: "radiogroup",
    "aria-required": required2,
    "aria-orientation": orientation,
    "data-disabled": disabled2 ? "" : void 0,
    dir: direction
  }, groupProps, {
    ref: forwardedRef
  }))));
});
const $f99a8c78507165f7$var$ITEM_NAME = "RadioGroupItem";
const $f99a8c78507165f7$export$9f866c100ef519e4 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeRadioGroup, disabled: disabled2, ...itemProps } = props;
  const context = $f99a8c78507165f7$var$useRadioGroupContext($f99a8c78507165f7$var$ITEM_NAME, __scopeRadioGroup);
  const isDisabled = context.disabled || disabled2;
  const rovingFocusGroupScope = $f99a8c78507165f7$var$useRovingFocusGroupScope(__scopeRadioGroup);
  const radioScope = $f99a8c78507165f7$var$useRadioScope(__scopeRadioGroup);
  const ref = reactExports.useRef(null);
  const composedRefs = $6ed0406888f73fc4$export$c7b2cbe3552a0d05(forwardedRef, ref);
  const checked = context.value === itemProps.value;
  const isArrowKeyPressedRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    const handleKeyDown = (event) => {
      if ($f99a8c78507165f7$var$ARROW_KEYS.includes(event.key)) isArrowKeyPressedRef.current = true;
    };
    const handleKeyUp = () => isArrowKeyPressedRef.current = false;
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
  return /* @__PURE__ */ reactExports.createElement($d7bdfb9eb0fdf311$export$6d08773d2e66f8f2, _extends$1({
    asChild: true
  }, rovingFocusGroupScope, {
    focusable: !isDisabled,
    active: checked
  }), /* @__PURE__ */ reactExports.createElement($ce77a8961b41be9e$export$d7b12c4107be0d61, _extends$1({
    disabled: isDisabled,
    required: context.required,
    checked
  }, radioScope, itemProps, {
    name: context.name,
    ref: composedRefs,
    onCheck: () => context.onValueChange(itemProps.value),
    onKeyDown: $e42e1063c40fb3ef$export$b9ecd428b558ff10((event) => {
      if (event.key === "Enter") event.preventDefault();
    }),
    onFocus: $e42e1063c40fb3ef$export$b9ecd428b558ff10(itemProps.onFocus, () => {
      var _ref$current;
      if (isArrowKeyPressedRef.current) (_ref$current = ref.current) === null || _ref$current === void 0 || _ref$current.click();
    })
  })));
});
const $f99a8c78507165f7$export$5fb54c671a65c88 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeRadioGroup, ...indicatorProps } = props;
  const radioScope = $f99a8c78507165f7$var$useRadioScope(__scopeRadioGroup);
  return /* @__PURE__ */ reactExports.createElement($ce77a8961b41be9e$export$d35a9ffa9a04f9e7, _extends$1({}, radioScope, indicatorProps, {
    ref: forwardedRef
  }));
});
const $f99a8c78507165f7$export$be92b6f5f03c0fe9 = $f99a8c78507165f7$export$a98f0dcb43a68a25;
const $f99a8c78507165f7$export$6d08773d2e66f8f2 = $f99a8c78507165f7$export$9f866c100ef519e4;
const $f99a8c78507165f7$export$adb584737d712b70 = $f99a8c78507165f7$export$5fb54c671a65c88;
const container$2 = "_5rVCA";
const radioButton = "DfBXS";
const item = "gxoaR";
const indicator = "CmqE5";
const label$3 = "KDcFa";
const disabled = "mHiZt";
const error$4 = "Uc0jm";
const RadioGroupRoot = reactExports.forwardRef(
  ({ className, error: error$12, ...rest }, ref) => {
    return /* @__PURE__ */ reactExports.createElement(
      $f99a8c78507165f7$export$be92b6f5f03c0fe9,
      {
        ref,
        className: clsx(container$2, { [error$4]: error$12 }, className),
        ...rest
      }
    );
  }
);
RadioGroupRoot.displayName = "RadioGroup.Root";
const RadioGroupItem = reactExports.forwardRef(
  ({ className, disabled: disabled$12, id: id2, label: label$12, ...rest }, ref) => {
    return /* @__PURE__ */ reactExports.createElement("section", { className: clsx(radioButton) }, /* @__PURE__ */ reactExports.createElement(
      $f99a8c78507165f7$export$6d08773d2e66f8f2,
      {
        id: id2,
        className: clsx(item, className),
        disabled: disabled$12,
        ...rest,
        ref
      }
    ), /* @__PURE__ */ reactExports.createElement("label", { className: clsx(label$3, disabled$12 && disabled), htmlFor: id2 }, label$12));
  }
);
RadioGroupItem.displayName = "RadioGroup.Item";
const RadioGroupIndicator = reactExports.forwardRef(({ className, ...rest }, ref) => /* @__PURE__ */ reactExports.createElement($f99a8c78507165f7$export$adb584737d712b70, { className: clsx(indicator, className), ...rest, ref }));
RadioGroupIndicator.displayName = "RadioGroup.Indicator";
reactExports.createContext(null);
const $409067139f391064$var$COLLAPSIBLE_NAME = "Collapsible";
const [$409067139f391064$var$createCollapsibleContext, $409067139f391064$export$952b32dcbe73087a] = $c512c27ab02ef895$export$50c7b4e9d9f19c1($409067139f391064$var$COLLAPSIBLE_NAME);
const [$409067139f391064$var$CollapsibleProvider, $409067139f391064$var$useCollapsibleContext] = $409067139f391064$var$createCollapsibleContext($409067139f391064$var$COLLAPSIBLE_NAME);
const $409067139f391064$export$6eb0f7ddcda6131f = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeCollapsible, open: openProp, defaultOpen, disabled: disabled2, onOpenChange, ...collapsibleProps } = props;
  const [open = false, setOpen] = $71cd76cc60e0454e$export$6f32135080cb4c3({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange
  });
  return /* @__PURE__ */ reactExports.createElement($409067139f391064$var$CollapsibleProvider, {
    scope: __scopeCollapsible,
    disabled: disabled2,
    contentId: $1746a345f3d73bb7$export$f680877a34711e37(),
    open,
    onOpenToggle: reactExports.useCallback(
      () => setOpen(
        (prevOpen) => !prevOpen
      ),
      [
        setOpen
      ]
    )
  }, /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034$1.div, _extends$1({
    "data-state": $409067139f391064$var$getState(open),
    "data-disabled": disabled2 ? "" : void 0
  }, collapsibleProps, {
    ref: forwardedRef
  })));
});
const $409067139f391064$var$CONTENT_NAME = "CollapsibleContent";
const $409067139f391064$export$aadde00976f34151 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { forceMount, ...contentProps } = props;
  const context = $409067139f391064$var$useCollapsibleContext($409067139f391064$var$CONTENT_NAME, props.__scopeCollapsible);
  return /* @__PURE__ */ reactExports.createElement(
    $921a889cee6df7e8$export$99c2b779aa4e8b8b,
    {
      present: forceMount || context.open
    },
    ({ present }) => /* @__PURE__ */ reactExports.createElement($409067139f391064$var$CollapsibleContentImpl, _extends$1({}, contentProps, {
      ref: forwardedRef,
      present
    }))
  );
});
const $409067139f391064$var$CollapsibleContentImpl = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { __scopeCollapsible, present, children, ...contentProps } = props;
  const context = $409067139f391064$var$useCollapsibleContext($409067139f391064$var$CONTENT_NAME, __scopeCollapsible);
  const [isPresent, setIsPresent] = reactExports.useState(present);
  const ref = reactExports.useRef(null);
  const composedRefs = $6ed0406888f73fc4$export$c7b2cbe3552a0d05(forwardedRef, ref);
  const heightRef = reactExports.useRef(0);
  const height = heightRef.current;
  const widthRef = reactExports.useRef(0);
  const width = widthRef.current;
  const isOpen = context.open || isPresent;
  const isMountAnimationPreventedRef = reactExports.useRef(isOpen);
  const originalStylesRef = reactExports.useRef();
  reactExports.useEffect(() => {
    const rAF = requestAnimationFrame(
      () => isMountAnimationPreventedRef.current = false
    );
    return () => cancelAnimationFrame(rAF);
  }, []);
  $9f79659886946c16$export$e5c5a5f917a5871c(() => {
    const node = ref.current;
    if (node) {
      originalStylesRef.current = originalStylesRef.current || {
        transitionDuration: node.style.transitionDuration,
        animationName: node.style.animationName
      };
      node.style.transitionDuration = "0s";
      node.style.animationName = "none";
      const rect = node.getBoundingClientRect();
      heightRef.current = rect.height;
      widthRef.current = rect.width;
      if (!isMountAnimationPreventedRef.current) {
        node.style.transitionDuration = originalStylesRef.current.transitionDuration;
        node.style.animationName = originalStylesRef.current.animationName;
      }
      setIsPresent(present);
    }
  }, [
    context.open,
    present
  ]);
  return /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034$1.div, _extends$1({
    "data-state": $409067139f391064$var$getState(context.open),
    "data-disabled": context.disabled ? "" : void 0,
    id: context.contentId,
    hidden: !isOpen
  }, contentProps, {
    ref: composedRefs,
    style: {
      [`--radix-collapsible-content-height`]: height ? `${height}px` : void 0,
      [`--radix-collapsible-content-width`]: width ? `${width}px` : void 0,
      ...props.style
    }
  }), isOpen && children);
});
function $409067139f391064$var$getState(open) {
  return open ? "open" : "closed";
}
const $409067139f391064$export$be92b6f5f03c0fe9 = $409067139f391064$export$6eb0f7ddcda6131f;
const $409067139f391064$export$7c6e2c02157bb7d2 = $409067139f391064$export$aadde00976f34151;
const error$2 = "qOzRH";
const collapsibleContent = "_5qi8c";
const ErrorBox = reactExports.forwardRef(
  ({ className, errorMessage, ...rest }, ref) => {
    return /* @__PURE__ */ reactExports.createElement($409067139f391064$export$be92b6f5f03c0fe9, { open: Boolean(errorMessage) }, /* @__PURE__ */ reactExports.createElement($409067139f391064$export$7c6e2c02157bb7d2, { className: collapsibleContent }, /* @__PURE__ */ reactExports.createElement("div", { ref, className: clsx(error$2, className), role: "alert", ...rest }, errorMessage || " ")));
  }
);
ErrorBox.displayName = "ErrorBox";
const typeaheadSelectInputRoot = "_typeaheadSelectInputRoot_1se9n_1";
const typeaheadSelectInputLabel = "_typeaheadSelectInputLabel_1se9n_9";
const error$1 = "_error_1se9n_13";
const styles$6 = {
  typeaheadSelectInputRoot,
  typeaheadSelectInputLabel,
  error: error$1
};
const TypeaheadSelectInput = reactExports.forwardRef(
  ({ searchValue, label: label2, handleSearchChange, errorMessage, ...restProps }, ref) => /* @__PURE__ */ React__default.createElement("div", { ref, className: styles$6.typeaheadSelectInputRoot }, label2 && /* @__PURE__ */ React__default.createElement(Label$1, { className: errorMessage ? styles$6.error : styles$6.typeaheadSelectInputLabel }, label2), /* @__PURE__ */ React__default.createElement(m$1, null, /* @__PURE__ */ React__default.createElement(I$1, null, /* @__PURE__ */ React__default.createElement(FontAwesomeIcon, { icon: faSearch, className: errorMessage ? styles$6.error : "" })), /* @__PURE__ */ React__default.createElement(
    s$1,
    {
      value: searchValue,
      onChange: handleSearchChange,
      error: !!errorMessage,
      fullWidth: true,
      ...restProps
    }
  )), /* @__PURE__ */ React__default.createElement(ErrorBox, { errorMessage }))
);
TypeaheadSelectInput.displayName = "TypeaheadSelectInput";
[
  DealRating$2.GREAT,
  DealRating$2.GOOD,
  DealRating$2.FAIR,
  DealRating$2.POOR,
  DealRating$2.OVERPRICED,
  DealRating$2.NA,
  DealRating$2.OUTLIER
];
const mapNearbyFilterListsFromDto = (dto) => ({
  trimNames: dto.trimNames ?? [],
  years: dto.years ?? []
});
const applyDeliveryFee = (price, listingDto) => {
  if (listingDto.isNationwide && price != null && listingDto.deliveryFee != null) {
    return price + Math.round(listingDto.deliveryFee);
  }
  return price ?? null;
};
const mapNearbyListingDto = (listingDto) => ({
  ...listingDto,
  trimId: listingDto.trimId ?? null,
  engineId: listingDto.engineId ?? null,
  year: listingDto.year ?? null,
  spId: listingDto.spId ?? null,
  mileage: listingDto.mileage ?? null,
  daysAtDealership: listingDto.daysAtDealership ?? null,
  dealRating: mapDealRatingFromPriceDto(listingDto.dealRating),
  price: listingDto.price ?? null,
  distance: listingDto.distance ?? null,
  listingRemovedDate: listingDto.listingRemovedDate ? new Date(listingDto.listingRemovedDate) : null,
  vehicleCondition: listingDto.vehicleCondition ?? null,
  inclusionType: listingDto.inclusionType ?? null,
  deliveryFee: listingDto.deliveryFee == null ? null : Math.round(listingDto.deliveryFee),
  dealRatingComparator: listingDto.dealRatingComparator ?? null,
  basePrice: applyDeliveryFee(listingDto.basePrice, listingDto),
  pricePlusFees: applyDeliveryFee(listingDto.pricePlusFees, listingDto),
  feesCompliant: listingDto.feesCompliant ?? false
});
const mapNearbyListingsFromDto = (dto) => {
  var _a;
  if (!((_a = dto.results) == null ? void 0 : _a.length)) {
    return [];
  }
  return dto.results.map((listing) => mapNearbyListingDto(listing));
};
const NEARBY_LISTINGS_API_URL = `${API_HOST$2}/Cars/dealerdashboard/api/GetNearbyListings.action`;
async function fetchNearbyListings$1(params) {
  try {
    const {
      serviceProviderId,
      makerId,
      modelId,
      makeName,
      modelName,
      listingId,
      radius,
      years,
      trimNames,
      dealRatings,
      minMileage,
      maxMileage,
      nationwide,
      vehicleConditions,
      listingStatus
    } = params;
    const urlParams = new URLSearchParams();
    urlParams.append("serviceProviderId", `sp${serviceProviderId}`);
    urlParams.append("makerId", String(makerId));
    urlParams.append("modelId", String(modelId));
    if (makeName != null) urlParams.append("makeName", makeName);
    if (modelName != null) urlParams.append("modelName", modelName);
    if (listingId != null) urlParams.append("listingId", String(listingId));
    if (radius != null) urlParams.append("radius", String(radius === 1e3 ? 5e4 : radius));
    years == null ? void 0 : years.forEach((y2) => {
      urlParams.append("years", String(y2));
    });
    trimNames == null ? void 0 : trimNames.forEach((t2) => {
      urlParams.append("trimNames", t2);
    });
    dealRatings == null ? void 0 : dealRatings.forEach((dr) => {
      urlParams.append("dealRatings", mapDealRatingToPriceDto(dr));
    });
    if (minMileage != null) urlParams.append("minMileage", String(minMileage));
    if (maxMileage != null) urlParams.append("maxMileage", String(maxMileage));
    if (nationwide != null) urlParams.append("nationwide", String(nationwide));
    vehicleConditions == null ? void 0 : vehicleConditions.forEach((vc2) => {
      urlParams.append("vehicleConditions", vc2);
    });
    if (listingStatus != null) urlParams.append("listingStatus", listingStatus);
    const response = await authFh.get(
      `${NEARBY_LISTINGS_API_URL}?${urlParams.toString()}`
    );
    return mapNearbyListingsFromDto(response ?? {});
  } catch (error2) {
    throw getErrorWithMessage(
      error2,
      "There was an unexpected error fetching PriceVantage nearby listings"
    );
  }
}
const NEARBY_FILTER_LISTS_API_URL = `${API_HOST$2}/Cars/dealerdashboard/api/GetFilterLists.action`;
async function fetchNearbyFilterLists(params) {
  try {
    const { serviceProviderId, makerId, modelId, radius, listingStatus } = params;
    const urlParams = new URLSearchParams();
    urlParams.append("serviceProviderId", `sp${serviceProviderId}`);
    urlParams.append("makerId", String(makerId));
    urlParams.append("modelId", String(modelId));
    if (radius != null) urlParams.append("radius", String(radius === 1e3 ? 5e4 : radius));
    if (listingStatus != null) urlParams.append("listingStatus", listingStatus);
    const response = await authFh.get(
      `${NEARBY_FILTER_LISTS_API_URL}?${urlParams.toString()}`
    );
    return mapNearbyFilterListsFromDto(response ?? {});
  } catch (error2) {
    throw getErrorWithMessage(
      error2,
      "There was an unexpected error fetching PriceVantage nearby filter lists"
    );
  }
}
const DETECTED_VINS_STORAGE_KEY = "detectedVins";
async function getTabVinData() {
  const data = await localStorageService.get(DETECTED_VINS_STORAGE_KEY);
  return data ?? {};
}
async function saveVins(data) {
  const existingData = await getTabVinData();
  const updatedData = {
    ...existingData,
    [data.tabId.toString()]: data
  };
  await localStorageService.set(DETECTED_VINS_STORAGE_KEY, updatedData);
}
async function clearVinsForTab(tabId) {
  const existingData = await getTabVinData();
  const { [tabId.toString()]: _, ...remainingData } = existingData;
  await localStorageService.set(DETECTED_VINS_STORAGE_KEY, remainingData);
}
async function getTabTrackingEvents() {
  const data = await sessionStorageService.get("trackingEvents");
  return data ?? {};
}
async function clearTrackingDataForTab(tabId) {
  const existingData = await getTabTrackingEvents();
  const { ...remainingData } = existingData;
  delete remainingData[tabId.toString()];
  await sessionStorageService.set("trackingEvents", remainingData);
}
var __defProp2 = Object.defineProperty;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField2 = (obj, key, value) => __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
const emptyTransmissionList = {
  all: { label: "", values: [] },
  trimSpecific: { label: "", values: [] }
};
class FetchNon2xxError2 extends Error {
  constructor(res) {
    super(`${res.status} response status, check the response["body"] property`);
    __publicField2(this, "response");
    this.name = "FetchNon2xxError";
    this.response = res;
  }
}
class FetchHelper2 {
  constructor(baseUrl2 = "") {
    __publicField2(this, "baseUrl");
    this.baseUrl = baseUrl2;
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.patch = this.patch.bind(this);
    this.fetchCg = this.fetchCg.bind(this);
  }
  /**
   * Make request options object
   *
   * Here we add all required request headers and initialization options (e.g., JSON.stringify
   * body property) to the fetch request.
   */
  static makeRequestOptions({ body, ...restInit }) {
    const req = { ...restInit };
    req.headers = {
      ...req.headers,
      "X-CG-Client-Id": "site-dep"
    };
    if (body instanceof FormData) {
      req.body = body;
    } else if ((body == null ? void 0 : body.constructor) === Object) {
      req.body = JSON.stringify(body);
      req.headers = {
        ...req.headers,
        "Content-Type": "application/json; charset=utf-8"
      };
    } else if (body) {
      throw new Error("body property only supports object literals and FormData objects");
    }
    return req;
  }
  /** Create a FetchNon2xxError which results from a non 2xx fetch response */
  static async createFetchNon2xxError(res) {
    const { status, url, headers } = res;
    let body;
    try {
      body = await res.json();
    } catch (error2) {
      body = {
        errors: [{ message: JSON.stringify(error2) }]
      };
    }
    return new FetchNon2xxError2({ status, url, headers, body });
  }
  /**
   * Convert a successful fetch response to json or text (depending on `responseType`); throw a
   * `FetchNon2xxError` for non-2xx responses. Returns `undefined` for 204 No Content.
   */
  static async validateResponse(res, responseType = "json") {
    if (!res.ok) {
      throw await this.createFetchNon2xxError(res);
    }
    if (res.status === 204) {
      return void 0;
    }
    switch (responseType) {
      case "text": {
        return await res.text();
      }
      case "json": {
        return await res.json();
      }
      default: {
        return await res.json();
      }
    }
  }
  /**
   * Base fetch wrapper that converts the response to json or text (based on `responseType`),
   * validates it, and returns a typed result.
   */
  async fetchCg(url, cgInit = {}) {
    const { interceptResponse, responseType = "json", ...fetchCgInit } = cgInit;
    const requestUrl = this.baseUrl + url;
    const init = FetchHelper2.makeRequestOptions(fetchCgInit);
    const res = await fetch(requestUrl, init);
    if (interceptResponse) {
      interceptResponse({
        init,
        response: res.clone()
      });
    }
    return FetchHelper2.validateResponse(res, responseType);
  }
  /** Sets method to get for fetchCg */
  get(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "get" });
  }
  /** Sets method to post for fetchCg */
  post(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "post" });
  }
  /** Sets method to put for fetchCg */
  put(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "put" });
  }
  /** Sets method to patch for fetchCg */
  patch(url, cgInit = {}) {
    return this.fetchCg(url, { ...cgInit, method: "PATCH" });
  }
}
const fh = new FetchHelper2();
const formatServiceProviderId = (spId) => `sp${spId}`;
const isTrimId = (trimId) => typeof trimId === "string" && trimId.startsWith("t");
const formatTrimId = (trimId) => {
  if (isTrimId(trimId)) {
    return trimId;
  }
  return `t${trimId}`;
};
const formatModelId = (modelId) => `d${modelId}`;
const buildUrl = (baseUrl2, params) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value);
  });
  return `${baseUrl2}?${queryParams.toString()}`;
};
const getDealerAccountInfo = async (spId, fetchHelper = fh) => {
  const baseUrl2 = "/Cars/dealerdashboard/api/DealerAccountInfoApi.action";
  const url = buildUrl(baseUrl2, {
    serviceProviderId: formatServiceProviderId(spId)
  });
  try {
    const response = await fetchHelper.get(url);
    return { data: response, error: null };
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch dealer account information";
    return { data: null, error: errorMsg };
  }
};
const getEngines = async (trimId, fetchHelper = fh) => {
  const baseUrl2 = "/Cars/getEngineList.action";
  const url = buildUrl(baseUrl2, {
    trim: formatTrimId(trimId)
  });
  try {
    const response = await fetchHelper.get(url);
    return { data: response, error: null };
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch engine list";
    return { data: null, error: `${errorMsg}` };
  }
};
const parseOptionList = (optionList) => {
  const wheelOptions = [];
  const generalOptions = [];
  if (!optionList) {
    return {
      wheelOptions,
      generalOptions
    };
  }
  const categories = optionList.split(";");
  categories.forEach((category) => {
    const [key, values2] = category.split("=");
    if (!key || !values2) {
      return;
    }
    const options = values2.split(",").map((option) => {
      const [id2, name] = option.split(":");
      return {
        id: Number.parseInt(id2, 10),
        name
      };
    });
    if (key === "WHEELS") {
      wheelOptions.push(...options);
    } else {
      generalOptions.push(...options);
    }
  });
  return {
    wheelOptions,
    generalOptions
  };
};
const getOptionListForTrim = async (trimId, fetchHelper = fh) => {
  const baseUrl2 = "/Cars/getOptionList.action";
  const url = buildUrl(baseUrl2, {
    trim: formatTrimId(trimId)
  });
  try {
    const response = await fetchHelper.get(url, { responseType: "text" });
    return {
      data: parseOptionList(response),
      error: null
    };
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : `Failed to fetch option list for trim: ${trimId}`;
    return { data: null, error: errorMsg };
  }
};
const baseUrl$2 = "/Cars/dealerdashboard/api/GetAutoCheckReportByVin.action";
const getExperianSummary = async (params, fetchHelper = fh) => {
  const url = buildUrl(baseUrl$2, {
    vin: params.vin,
    serviceProviderId: `sp${params.serviceProviderId}`
  });
  try {
    const response = await fetchHelper.get(url);
    return { data: response, error: null };
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch Experian summary information";
    return { data: null, error: errorMsg };
  }
};
const getImvLookupUrl = "/Cars/dealerdashboard/api/GetImvLookup.action";
const getImvLookupData = async (spId, params, fetchHelper = fh) => {
  const url = buildUrl(getImvLookupUrl, {
    serviceProviderId: String(spId)
  });
  try {
    const response = await fetchHelper.post(url, {
      body: params
    });
    if ("errorMessage" in response) {
      const { errorMessage: errorMessage2, errorCode } = response;
      return { data: null, error: `${errorCode}: ${errorMessage2}` };
    }
    return { data: response, error: null };
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch IMV lookup information";
    return { data: null, error: `${errorMsg}` };
  }
};
const dealRatingMap = {
  GREAT_PRICE: "GREAT",
  GOOD_PRICE: "GOOD",
  OK_PRICE: "FAIR",
  FAIR_PRICE: "FAIR",
  OUTLIER: "UNCERTAIN",
  OVERPRICED: "OVERPRICED",
  POOR_PRICE: "HIGH",
  NA: "NONE"
};
const dealRatingReverseMap = {
  GREAT: "GREAT_PRICE",
  GOOD: "GOOD_PRICE",
  FAIR: "FAIR_PRICE",
  UNCERTAIN: "OUTLIER",
  OVERPRICED: "OVERPRICED",
  NONE: "NA",
  HIGH: "POOR_PRICE"
};
const dealRatingMapper = (dealRatingPriceDtoValue) => {
  if (!dealRatingPriceDtoValue) {
    return "NONE";
  }
  return dealRatingPriceDtoValue in dealRatingMap ? dealRatingMap[dealRatingPriceDtoValue] : "NONE";
};
const dealRatingReverseMapper = (rating) => dealRatingReverseMap[rating] || "NA";
const mapNearbyListingsFromResponse = (dto) => {
  if (!dto.results || dto.results.length === 0) {
    return [];
  }
  return dto.results.map((listingDto) => ({
    ...listingDto,
    trimId: listingDto.trimId ?? null,
    engineId: listingDto.engineId ?? null,
    year: listingDto.year ?? null,
    spId: listingDto.spId ?? null,
    mileage: listingDto.mileage ?? null,
    daysAtDealership: listingDto.daysAtDealership ?? null,
    dealRating: dealRatingMapper(listingDto.dealRating),
    price: listingDto.price ?? null,
    city: listingDto.city ?? null,
    state: listingDto.state ?? null
  }));
};
const getNearbyListingsUrl = "/Cars/dealerdashboard/api/GetNearbyListingsWithAverages.action";
const defaultRadius = 50;
const getNearbyListings = async (requestParams, fetchHelper = fh) => {
  var _a;
  const params = {
    serviceProviderId: formatServiceProviderId(requestParams.serviceProviderId),
    makerId: `${requestParams.makerId}`,
    modelId: `${requestParams.modelId}`
  };
  params.radius = requestParams.radius ? `${requestParams.radius}` : `${defaultRadius}`;
  if (requestParams.years) {
    params.years = `${requestParams.years.join(",")}`;
  }
  if (requestParams.pageSize) {
    params.pageSize = `${requestParams.pageSize}`;
  }
  if (requestParams.trimNames) {
    params.trimNames = `${requestParams.trimNames}`;
  }
  if (requestParams.zipCode) {
    params.zipCode = `${requestParams.zipCode}`;
  }
  if ((_a = requestParams.dealRatings) == null ? void 0 : _a.length) {
    params.dealRatings = `${requestParams.dealRatings.map((rating) => dealRatingReverseMapper(rating)).join(",")}`;
  }
  if (requestParams.minMileage) {
    params.minMileage = `${requestParams.minMileage}`;
  }
  if (requestParams.maxMileage) {
    params.maxMileage = `${requestParams.maxMileage}`;
  }
  const url = buildUrl(getNearbyListingsUrl, params);
  try {
    const response = await fetchHelper.get(
      url
    );
    if ("errorMessage" in response) {
      const { errorMessage: errorMessage2, errorCode } = response;
      return { data: null, error: `${errorCode}: ${errorMessage2}` };
    }
    const nearbyListings = mapNearbyListingsFromResponse(response);
    return {
      data: { nearbyListings, marketData: response.marketDataAverages ?? null },
      error: null
    };
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch nearby listings";
    return { data: null, error: errorMsg };
  }
};
const baseUrl$1 = "/Cars/dealerdashboard/api/GetBookValuesByVIN.action";
const getBookValues = async (requestParams, fetchHelper = fh) => {
  const { spId, ...args } = requestParams;
  const params = {
    serviceProviderId: String(spId)
  };
  const url = buildUrl(baseUrl$1, params);
  try {
    const data = await fetchHelper.post(url, {
      body: args
    });
    return { data: data.bookValues, error: null };
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch book values";
    return { error: errorMsg, data: null };
  }
};
const getFilterListsUrl = "/Cars/dealerdashboard/api/GetFilterLists.action";
const getFilterLists = async (requestParams, fetchHelper = fh) => {
  const url = buildUrl(getFilterListsUrl, {
    makerId: `${requestParams.makerId}`,
    modelId: `${requestParams.modelId}`,
    radius: `${requestParams.radius}`,
    serviceProviderId: formatServiceProviderId(requestParams.serviceProviderId)
  });
  try {
    return await fetchHelper.get(url);
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch filter lists";
    throw new Error(errorMsg);
  }
};
const baseUrl = "/Cars/dealerdashboard/api/GetNearbyListingsMarketDataMds.action";
const getMds = async (requestParams, fetchHelper = fh) => {
  const { serviceProviderId, trimId, postalCode, vin, carId } = requestParams;
  const params = {
    serviceProviderId: String(serviceProviderId),
    trimId: String(trimId),
    postalCode,
    vin,
    ...carId != null && { carId: String(carId) }
  };
  const url = buildUrl(baseUrl, params);
  try {
    const data = await fetchHelper.get(url);
    return { data, error: null };
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch Mds";
    return { data: null, error: errorMsg };
  }
};
reactExports.createContext({
  fetchDealerAccountInfo: () => Promise.resolve(null),
  lookupVehicleByVin: () => Promise.resolve(null),
  fetchEngines: () => Promise.resolve([]),
  getTransmissions: () => Promise.resolve(emptyTransmissionList),
  getTrims: () => Promise.resolve(null),
  getOptions: () => Promise.resolve({ data: null, error: "Not implemented" }),
  fetchExperianSummary: () => Promise.resolve({ data: null, error: "Not implemented" }),
  fetchNearbyListings: () => Promise.resolve(null),
  fetchBookValues: () => Promise.resolve(null),
  fetchFilterLists: () => Promise.resolve(null),
  fetchMds: () => Promise.resolve(null),
  environment: "dashboard",
  cvtFormRef: reactExports.createRef(),
  getImvLookup: () => Promise.resolve(null)
});
const card$2 = "_card_17rsv_1";
const footer = "_footer_17rsv_7";
const styles$u = {
  card: card$2,
  footer
};
reactExports.forwardRef(
  ({ header, footer: footer2, children, containerProps, headerProps, contentProps, footerProps }, ref) => /* @__PURE__ */ React__default.createElement(
    "section",
    {
      ...containerProps,
      className: clsx(styles$u.card, containerProps == null ? void 0 : containerProps.className),
      ref
    },
    header && /* @__PURE__ */ React__default.createElement("header", { ...headerProps }, header),
    /* @__PURE__ */ React__default.createElement("main", { ...contentProps, className: contentProps == null ? void 0 : contentProps.className }, children),
    footer2 && /* @__PURE__ */ React__default.createElement("footer", { ...footerProps, className: clsx(styles$u.footer, footerProps == null ? void 0 : footerProps.className) }, footer2)
  )
);
reactExports.createContext({
  vin: "",
  mileage: "",
  zipCode: "",
  dealerZipCode: "",
  country: "",
  setVin: () => {
  },
  reset: () => {
  },
  setMileage: () => {
  },
  setZipCode: () => {
  },
  zipCodeError: null,
  zipCodeLoading: false,
  hasAccessStockVantage: false,
  mdsEnabledForAllUsers: false
});
reactExports.createContext(null);
reactExports.createContext(null);
reactExports.createContext({
  open: () => {
  },
  close: () => {
  },
  toggle: () => {
  },
  isOpen: false
});
reactExports.createContext(void 0);
reactExports.createContext(null);
var DealRating = /* @__PURE__ */ ((DealRating2) => {
  DealRating2[DealRating2["GREAT"] = 0] = "GREAT";
  DealRating2[DealRating2["GOOD"] = 1] = "GOOD";
  DealRating2[DealRating2["OK"] = 2] = "OK";
  DealRating2[DealRating2["NA"] = 3] = "NA";
  DealRating2[DealRating2["FAIR"] = 4] = "FAIR";
  DealRating2[DealRating2["OUTLIER"] = 5] = "OUTLIER";
  DealRating2[DealRating2["POOR"] = 6] = "POOR";
  DealRating2[DealRating2["OVERPRICED"] = 7] = "OVERPRICED";
  return DealRating2;
})(DealRating || {});
[
  DealRating.GREAT,
  DealRating.GOOD,
  DealRating.FAIR,
  DealRating.POOR,
  DealRating.OVERPRICED
];
const p = "nIsIw", u = "q3Rgo", i = "owHab", f = "j7bmG", l = "_5W0cG", s = "O9uq6";
const d = reactExports.forwardRef(
  ({ className: o2, error: n2 = false, fullWidth: t2 = false, ...r2 }, c) => /* @__PURE__ */ reactExports.createElement(
    "input",
    {
      ref: c,
      className: clsx(
        p,
        {
          [u]: n2,
          [s]: t2
        },
        o2
      ),
      ...r2
    }
  )
);
d.displayName = "Input";
const m = reactExports.forwardRef(
  ({ className: o2, ...n2 }, t2) => /* @__PURE__ */ reactExports.createElement("div", { ref: t2, className: clsx(i, o2), ...n2 })
);
m.displayName = "Input.Group";
const I = reactExports.forwardRef(
  ({ className: o2, ...n2 }, t2) => {
    const r2 = typeof n2.onClick != "undefined" || // 'onKeyPress' is deprecated. https://github.com/facebook/react/issues/25888
    typeof n2.onKeyUp != "undefined" || typeof n2.onKeyDown != "undefined" || typeof n2.tabIndex != "undefined" || typeof n2.role != "undefined";
    return /* @__PURE__ */ reactExports.createElement(
      "span",
      {
        ref: t2,
        className: clsx(f, { [l]: r2 }, o2),
        ...n2
      }
    );
  }
);
I.displayName = "Input.Icon";
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e = 1; e < arguments.length; e++) {
      var t2 = arguments[e];
      for (var r2 in t2) ({}).hasOwnProperty.call(t2, r2) && (n2[r2] = t2[r2]);
    }
    return n2;
  }, _extends.apply(null, arguments);
}
function $6ed0406888f73fc4$var$setRef(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref !== null && ref !== void 0) ref.current = value;
}
function $6ed0406888f73fc4$export$43e446d32b3d21af(...refs) {
  return (node) => refs.forEach(
    (ref) => $6ed0406888f73fc4$var$setRef(ref, node)
  );
}
const $5e63c961fc1ce211$export$8c6ed5c666ac1360 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  const childrenArray = reactExports.Children.toArray(children);
  const slottable = childrenArray.find($5e63c961fc1ce211$var$isSlottable);
  if (slottable) {
    const newElement = slottable.props.children;
    const newChildren = childrenArray.map((child) => {
      if (child === slottable) {
        if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
        return /* @__PURE__ */ reactExports.isValidElement(newElement) ? newElement.props.children : null;
      } else return child;
    });
    return /* @__PURE__ */ reactExports.createElement($5e63c961fc1ce211$var$SlotClone, _extends({}, slotProps, {
      ref: forwardedRef
    }), /* @__PURE__ */ reactExports.isValidElement(newElement) ? /* @__PURE__ */ reactExports.cloneElement(newElement, void 0, newChildren) : null);
  }
  return /* @__PURE__ */ reactExports.createElement($5e63c961fc1ce211$var$SlotClone, _extends({}, slotProps, {
    ref: forwardedRef
  }), children);
});
$5e63c961fc1ce211$export$8c6ed5c666ac1360.displayName = "Slot";
const $5e63c961fc1ce211$var$SlotClone = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  const { children, ...slotProps } = props;
  if (/* @__PURE__ */ reactExports.isValidElement(children)) return /* @__PURE__ */ reactExports.cloneElement(children, {
    ...$5e63c961fc1ce211$var$mergeProps(slotProps, children.props),
    ref: forwardedRef ? $6ed0406888f73fc4$export$43e446d32b3d21af(forwardedRef, children.ref) : children.ref
  });
  return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
});
$5e63c961fc1ce211$var$SlotClone.displayName = "SlotClone";
const $5e63c961fc1ce211$export$d9f1ccf0bdb05d45 = ({ children }) => {
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, children);
};
function $5e63c961fc1ce211$var$isSlottable(child) {
  return /* @__PURE__ */ reactExports.isValidElement(child) && child.type === $5e63c961fc1ce211$export$d9f1ccf0bdb05d45;
}
function $5e63c961fc1ce211$var$mergeProps(slotProps, childProps) {
  const overrideProps = {
    ...childProps
  };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) overrideProps[propName] = (...args) => {
        childPropValue(...args);
        slotPropValue(...args);
      };
      else if (slotPropValue) overrideProps[propName] = slotPropValue;
    } else if (propName === "style") overrideProps[propName] = {
      ...slotPropValue,
      ...childPropValue
    };
    else if (propName === "className") overrideProps[propName] = [
      slotPropValue,
      childPropValue
    ].filter(Boolean).join(" ");
  }
  return {
    ...slotProps,
    ...overrideProps
  };
}
const $8927f6f2acc4f386$var$NODES = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "span",
  "svg",
  "ul"
];
const $8927f6f2acc4f386$export$250ffa63cdc0d034 = $8927f6f2acc4f386$var$NODES.reduce((primitive, node) => {
  const Node2 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? $5e63c961fc1ce211$export$8c6ed5c666ac1360 : node;
    reactExports.useEffect(() => {
      window[Symbol.for("radix-ui")] = true;
    }, []);
    return /* @__PURE__ */ reactExports.createElement(Comp, _extends({}, primitiveProps, {
      ref: forwardedRef
    }));
  });
  Node2.displayName = `Primitive.${node}`;
  return {
    ...primitive,
    [node]: Node2
  };
}, {});
const $b73a6c6685e72184$export$b04be29aa201d4f5 = /* @__PURE__ */ reactExports.forwardRef((props, forwardedRef) => {
  return /* @__PURE__ */ reactExports.createElement($8927f6f2acc4f386$export$250ffa63cdc0d034.label, _extends({}, props, {
    ref: forwardedRef,
    onMouseDown: (event) => {
      var _props$onMouseDown;
      (_props$onMouseDown = props.onMouseDown) === null || _props$onMouseDown === void 0 || _props$onMouseDown.call(props, event);
      if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
    }
  }));
});
const label = "-yKEV";
const error = "XeScj";
const required = "OWXFk";
const REQUIRED_INDICATOR = " *";
const Label = reactExports.forwardRef(
  ({ children, className, error: error$12 = false, required: required$1 = false, ...props }, ref) => {
    return /* @__PURE__ */ reactExports.createElement(
      $b73a6c6685e72184$export$b04be29aa201d4f5,
      {
        ref,
        className: clsx(label, { [error]: error$12 }, className),
        ...props
      },
      children,
      required$1 && /* @__PURE__ */ reactExports.createElement("span", { "aria-hidden": "true", className: required }, REQUIRED_INDICATOR)
    );
  }
);
Label.displayName = "Label";
const formControlError = "XhA40";
const selectContainer = "Br01F";
const fullWidth = "uGngz";
const chevronIcon$1 = "BWxld";
const select = "_0c4-G";
const placeholder = "rWO2r";
const Select = reactExports.forwardRef(
  ({
    children,
    className,
    defaultValue: defaultValueProp,
    disabled: disabled2,
    error: error2 = false,
    fullWidth: fullWidth$1 = false,
    onChange: onChange2,
    placeholder: placeholder$12,
    value: valueProp,
    ...rest
  }, ref) => {
    const [isFilled, setIsFilled] = reactExports.useState(!placeholder$12);
    const handleChange = reactExports.useCallback(
      (e) => {
        var _a;
        if (onChange2) {
          onChange2(e);
        }
        setIsFilled(!!((_a = e.target) == null ? void 0 : _a.value));
      },
      [onChange2]
    );
    let value;
    let defaultValue;
    let isPlaceholder = false;
    if (valueProp !== void 0) {
      value = valueProp != null ? valueProp : "";
      isPlaceholder = valueProp == null;
    } else {
      defaultValue = defaultValueProp != null ? defaultValueProp : "";
      isPlaceholder = defaultValueProp == null && !isFilled;
    }
    return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(
      "div",
      {
        className: clsx(selectContainer, {
          [formControlError]: error2,
          [fullWidth]: fullWidth$1
        })
      },
      /* @__PURE__ */ reactExports.createElement(
        "select",
        {
          ref,
          className: clsx(
            select,
            {
              [placeholder]: placeholder$12 && isPlaceholder
            },
            className
          ),
          onChange: handleChange,
          disabled: disabled2,
          "data-error": error2 ? "" : void 0,
          value,
          defaultValue,
          ...rest
        },
        placeholder$12 && /* @__PURE__ */ reactExports.createElement("option", { value: "", disabled: true }, placeholder$12),
        children
      ),
      /* @__PURE__ */ reactExports.createElement(
        "svg",
        {
          xmlns: "http://www.w3.org/2000/svg",
          className: chevronIcon$1,
          viewBox: "0 0 18 18",
          fill: "none"
        },
        /* @__PURE__ */ reactExports.createElement("path", { d: "M14 7L9 12L4 7", strokeWidth: "1.5" })
      )
    ));
  }
);
Select.displayName = "Select";
var faChevronUp = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var prefix = "far";
  var iconName = "chevron-up";
  var width = 512;
  var height = 512;
  var aliases = [];
  var unicode = "f077";
  var svgPathData = "M239 111c9.4-9.4 24.6-9.4 33.9 0L465 303c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-175-175L81 337c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9L239 111z";
  exports.definition = {
    prefix,
    iconName,
    icon: [
      width,
      height,
      aliases,
      unicode,
      svgPathData
    ]
  };
  exports.faChevronUp = exports.definition;
  exports.prefix = prefix;
  exports.iconName = iconName;
  exports.width = width;
  exports.height = height;
  exports.ligatures = aliases;
  exports.unicode = unicode;
  exports.svgPathData = svgPathData;
  exports.aliases = aliases;
})(faChevronUp);
const fetchDealerAccountInfo = async (serviceProviderId, fetchHelper) => {
  var _a;
  if (!serviceProviderId) return null;
  const dealerInfo = await getDealerAccountInfo(serviceProviderId, fetchHelper);
  if (!((_a = dealerInfo.data) == null ? void 0 : _a.dealershipZipCode)) {
    throw new Error("Failed to fetch dealer information");
  }
  return {
    zipCode: dealerInfo.data.dealershipZipCode || "",
    country: dealerInfo.data.serviceProviderCountry ?? null,
    hasAccessStockVantage: !!dealerInfo.data.hasAccessStockVantage
  };
};
const getImvLookup = async (args) => {
  if (!args) return null;
  const { serviceProviderId, fetchHelper, ...requestBody } = args;
  if (!serviceProviderId) return null;
  const { data, error: error2 } = await getImvLookupData(serviceProviderId, requestBody, fetchHelper);
  if (error2) {
    throw new Error(error2);
  }
  return data;
};
const getTrims = async (modelId, fetchHelper) => {
  if (!modelId || typeof modelId !== "string" && typeof modelId !== "number") {
    return null;
  }
  const baseUrl2 = "/Cars/getSelectedModelCarTrimsAJAX.action";
  const url = buildUrl(baseUrl2, {
    model: formatModelId(modelId),
    forPriceAnalysis: "false",
    useInventoryService: "false",
    localeCountryCarsOnly: "false",
    showInactive: "false",
    newCarsOnly: "false",
    quotableCarsOnly: "false",
    carsWithRegressionOnly: "false",
    isResearch: "false"
  });
  try {
    const response = await fetchHelper.get(url);
    return Object.fromEntries(
      Object.entries(response).map(([key, value]) => [key.replace("c", ""), value])
    );
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch trims";
    throw new Error(errorMsg);
  }
};
const getTransmissions = async (_trimId, fetchHelper) => {
  const trimIdString = String(_trimId);
  const trimIdWithoutPrefix = trimIdString.startsWith("t") ? trimIdString.slice(1) : trimIdString;
  const trimId = Number(trimIdWithoutPrefix);
  if (Number.isNaN(trimId)) return emptyTransmissionList;
  const baseUrl2 = "/Cars/getTransmissionListTrimFirstJson.action";
  const url = buildUrl(baseUrl2, {
    trim: formatTrimId(trimId)
  });
  try {
    return await fetchHelper.get(url);
  } catch (error2) {
    const errorMsg = error2 instanceof Error ? error2.message : "Failed to fetch transmission list";
    throw new Error(errorMsg);
  }
};
const emptyEngineList = [];
const fetchEngines = async (activeTrim, fetchHelper) => {
  if (!activeTrim) return emptyEngineList;
  if (typeof activeTrim === "string" || typeof activeTrim === "number") {
    const response = await getEngines(formatTrimId(activeTrim), fetchHelper);
    return response.data ?? emptyEngineList;
  }
  return emptyEngineList;
};
const getOptions = async (activeTrim, fetchHelper) => {
  const emptyResult = { data: { wheelOptions: [], generalOptions: [] }, error: null };
  if (!activeTrim) return emptyResult;
  if (typeof activeTrim === "string") {
    const trimId = Number.parseInt(activeTrim.replace("t", ""), 10);
    if (Number.isNaN(trimId)) {
      return { data: null, error: `Invalid trimId: ${activeTrim}` };
    }
    return getOptionListForTrim(trimId, fetchHelper);
  }
  return getOptionListForTrim(activeTrim, fetchHelper);
};
const fetchExperianSummary = async (vin, serviceProviderId, fetchHelper) => {
  if (!vin) {
    return { data: null, error: "VIN is required" };
  }
  if (!serviceProviderId) {
    return { data: null, error: "Service Provider ID is required" };
  }
  return getExperianSummary({ vin, serviceProviderId }, fetchHelper);
};
const fetchNearbyListings = async (requestParams, fetchHelper) => {
  const response = await getNearbyListings(requestParams, fetchHelper);
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data ?? null;
};
const fetchBookValues = async (requestParams, fetchHelper) => {
  const { data, error: error2 } = await getBookValues(requestParams, fetchHelper);
  if (error2) throw new Error(error2);
  return data;
};
const fetchFilterLists = async (requestParams, fetchHelper) => {
  const { makerId, modelId, radius, serviceProviderId } = requestParams;
  if (!makerId || !modelId || !serviceProviderId) return null;
  return getFilterLists({ makerId, modelId, radius, serviceProviderId }, fetchHelper);
};
const fetchMds = async (requestParams, fetchHelper) => {
  const { data, error: error2 } = await getMds(requestParams, fetchHelper);
  if (error2) throw new Error(error2);
  return data ?? null;
};
function handleCheckLoginStatus(sendResponse) {
  void checkLoginStatus().then((isLoggedIn) => {
    sendResponse({ success: true, data: { isLoggedIn } });
  });
  return true;
}
function handleInitiateLogin(message, sendResponse) {
  const { email } = message;
  initiateOAuthFlow(email).then(() => {
    sendResponse({ success: true });
  }).catch((error2) => {
    logError("Login handler: Failed to initiate OAuth flow", error2);
    const errorMessage = error2 instanceof Error ? error2.message : String(error2);
    const errorCode = getOAuthErrorCode(errorMessage);
    sendResponse({
      success: false,
      error: errorMessage,
      errorCode
    });
  });
  return true;
}
function handleLogout(sendResponse) {
  void logout().then((success) => {
    sendResponse({ success });
  });
  return true;
}
function handleFetchPriceRecommendations(message, sendResponse) {
  const { serviceProviderId, vins } = message;
  fetchPricingRecData(serviceProviderId, vins).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchServiceProviders(message, sendResponse) {
  const { serviceProviderId } = message;
  fetchServiceProviders(serviceProviderId).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleOpenSidePanel(message, sender, sendResponse) {
  const { vin } = message;
  const { id: tabId } = sender.tab ?? {};
  if (!tabId) {
    sendResponse({ success: false, error: "No active tab found" });
    return true;
  }
  if (vin) {
    localStorageService.set("selectedVin", vin);
  }
  localStorageService.set("openSidePanelFrom", "vinCGIcon");
  chrome.sidePanel.open({ tabId }).then(() => {
    sendResponse({ success: true, data: { vin } });
    return true;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleOpenBackgroundLink(message, sendResponse) {
  const { url } = message;
  void chrome.tabs.create({
    url,
    active: false
  }).then(() => {
    sendResponse({ success: true, data: { url } });
    return true;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleSaveVins(message, sendResponse) {
  const { detectedVins } = message;
  saveVins(detectedVins).then(() => localStorageService.set("vinScanningInProgress", false)).then(() => {
    sendResponse({ success: true });
    return null;
  }).catch((error2) => {
    void localStorageService.set("vinScanningInProgress", false);
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleProcessDetectedVins(message, sender, sendResponse) {
  const { detectedVins } = message;
  const { id: tabId } = sender.tab ?? {};
  if (!tabId) {
    sendResponse({ success: false, error: "No tab ID available for VIN processing" });
    return true;
  }
  saveVins(detectedVins).then(() => localStorageService.set("vinScanningInProgress", false)).then(
    () => chrome.tabs.sendMessage(tabId, {
      type: "TAG_VINS",
      vins: detectedVins.vins
    })
  ).then(() => {
    sendResponse({ success: true });
    return null;
  }).catch((error2) => {
    void localStorageService.set("vinScanningInProgress", false);
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleClearVinScanningFlag(sendResponse) {
  chrome.storage.local.set({ vinScanningInProgress: false }).then(() => {
    sendResponse({ success: true });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleCheckForUpdate(sendResponse) {
  (async () => {
    try {
      const stored = await chrome.storage.local.get(["updateAvailable"]);
      const storedUpdateAvailable = stored.updateAvailable === true;
      let checkStatus;
      try {
        const result = await chrome.runtime.requestUpdateCheck();
        checkStatus = result.status;
      } catch {
        checkStatus = "no_update";
      }
      const updateAvailable = storedUpdateAvailable || checkStatus === "update_available";
      const updateReady = storedUpdateAvailable;
      if (checkStatus === "update_available" && !storedUpdateAvailable) {
        await chrome.storage.local.set({ updateAvailable: true });
      }
      sendResponse({
        success: true,
        data: { updateAvailable, updateReady }
      });
    } catch (error2) {
      sendResponse({
        success: false,
        error: error2 instanceof Error ? error2.message : String(error2)
      });
    }
  })();
  return true;
}
function handleApplyUpdate(sendResponse) {
  sendResponse({ success: true });
  setTimeout(() => {
    chrome.runtime.reload();
  }, 100);
  return true;
}
function handleFetchLeadPredictions(message, sendResponse) {
  const { serviceProviderId, listingId, prices } = message;
  fetchLeadPredictions(serviceProviderId, listingId, prices).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handlePublishPrice(message, sendResponse) {
  const { listing, fees, newPrice, newPriceIncludesFees } = message;
  publishPrice(listing, fees, newPrice, newPriceIncludesFees).then(() => {
    sendResponse({ success: true });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleUnknownAction(message, sendResponse) {
  const actionValue = String(message.action);
  sendResponse({ success: false, error: `Unknown action: ${actionValue}` });
  return true;
}
function handleFetchDealerAccountInfo(message, sendResponse) {
  const { serviceProviderId } = message;
  fetchDealerAccountInfo(serviceProviderId, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchEngines(message, sendResponse) {
  const { activeTrim } = message;
  fetchEngines(activeTrim, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleGetTransmissions(message, sendResponse) {
  const { trimId } = message;
  getTransmissions(trimId, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleGetTrims(message, sendResponse) {
  const { modelId } = message;
  getTrims(modelId, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleGetOptions(message, sendResponse) {
  const { trimId } = message;
  getOptions(trimId, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchExperianSummary(message, sendResponse) {
  const { vin, serviceProviderId } = message;
  fetchExperianSummary(vin, serviceProviderId, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchCVTNearbyListings(message, sendResponse) {
  const { action: _, ...payload } = message;
  fetchNearbyListings(payload, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleGetImvLookup(message, sendResponse) {
  const { action: _, ...payload } = message;
  getImvLookup({ ...payload, fetchHelper: carValuesAuthFh }).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchFilterLists(message, sendResponse) {
  const { action: _, ...payload } = message;
  fetchFilterLists(payload, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchBookValues(message, sendResponse) {
  const { action: _, ...payload } = message;
  fetchBookValues(payload, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchMds(message, sendResponse) {
  const { action: _, ...payload } = message;
  fetchMds(payload, carValuesAuthFh).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchFeeTaxBreakdown(message, sendResponse) {
  const { serviceProviderId } = message;
  fetchFeeTaxBreakdown(serviceProviderId).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchInventorySettings(message, sendResponse) {
  const { serviceProviderId } = message;
  fetchInventorySettings(serviceProviderId).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchNearbyListings(message, sendResponse) {
  const { action: _, ...params } = message;
  fetchNearbyListings$1(params).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function handleFetchNearbyFilterLists(message, sendResponse) {
  const { action: _, ...params } = message;
  fetchNearbyFilterLists(params).then((response) => {
    sendResponse({ success: true, data: response });
    return null;
  }).catch((error2) => {
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
function isValidInjectionTarget(tab) {
  const url = tab.url ?? "";
  return !!tab.id && tab.status === "complete" && /^https?:\/\//.test(url) && !url.startsWith("chrome://") && !url.startsWith("chrome-extension://") && !url.startsWith("devtools://") && !url.startsWith("chrome-error://") && !url.includes("chrome.google.com/webstore") && !url.includes("google.com/chrome/webstore") && !url.includes("chromewebstore.google.com") && url !== "about:blank";
}
async function waitForTabToBeReady(tabId, maxRetries = 10, delay = 250) {
  for (let i2 = 0; i2 < maxRetries; i2 += 1) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") {
      return true;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }
  return false;
}
async function unregisterContentScripts() {
  try {
    const scripts = await chrome.scripting.getRegisteredContentScripts();
    const hasRegisteredScript = scripts.some((script) => script.id === "vin-scanner-script");
    if (hasRegisteredScript) {
      logDebug("Found existing content script registration, unregistering...");
      await chrome.scripting.unregisterContentScripts({
        ids: ["vin-scanner-script"]
      });
    }
  } catch (error2) {
    logError("Error unregistering content scripts:", error2);
  }
}
async function registerContentScripts() {
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: "vin-scanner-script",
        js: ["content/index.js"],
        matches: ["<all_urls>"],
        runAt: "document_idle"
      }
    ]);
  } catch (error2) {
    logError("Error registering content scripts:", error2);
  }
}
async function ensureContentScriptInjected(tabId) {
  try {
    const isReady = await waitForTabToBeReady(tabId);
    if (!isReady) {
      logDebug(
        `Content script could not be injected as tab ${tabId} did not become ready in time.`
      );
      return;
    }
    const tab = await chrome.tabs.get(tabId);
    if (!isValidInjectionTarget(tab)) {
      logDebug(
        `Tab ${tabId} is not a valid injection target (URL: ${tab.url}, status: ${tab.status})`
      );
      return;
    }
    const scripts = await chrome.scripting.getRegisteredContentScripts();
    const isRegistered = scripts.some((script) => script.id === "vin-scanner-script");
    if (!isRegistered) {
      logDebug("No content script registration found, registering new script...");
      await registerContentScripts();
    }
    try {
      await chrome.tabs.sendMessage(tabId, { type: "PING" });
      logDebug("Content script already injected and responsive, skipping injection");
      return;
    } catch {
      logDebug("Content script not responsive, injecting...");
    }
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/index.js"]
    });
    logDebug(`Successfully injected content script for tab ${tabId}`);
  } catch (error2) {
    logErrorWithTabContext("Error ensuring content script injection", tabId, { error: error2 });
  }
}
async function handlePageChange(tabId, url, changeType, eventDetail, forceRescan = false) {
  try {
    await localStorageService.set("vinScanningInProgress", true);
    await ensureContentScriptInjected(tabId);
    await chrome.tabs.sendMessage(tabId, {
      type: "PAGE_CHANGE",
      tabId,
      url,
      changeType,
      eventDetail,
      forceRescan
    });
  } catch (error2) {
    if (error2 instanceof Error && error2.message.includes("message channel closed")) {
      logDebug(
        `Tab ${tabId} was closed or navigated away before page change (${changeType}) could complete - this is normal`
      );
    } else {
      logWarning(`Can't notify page change (${changeType}) for tab ${tabId}:`, error2);
    }
    await localStorageService.set("vinScanningInProgress", false);
  }
}
async function handleActiveTabNavigation(tabId, url, eventType) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const isActiveTab = tabs.length > 0 && tabs[0].id === tabId;
    if (isActiveTab) {
      await clearVinsForTab(tabId);
      await handlePageChange(tabId, url, "navigation", eventType);
    } else {
      logDebug(`Skipping navigation handling for inactive tab ${tabId}`);
    }
  } catch (error2) {
    logWarning(`Error checking active tab for ${eventType}:`, error2);
  }
}
function handleRedetectVins(message, _sender, sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
    const activeTab = tabs[0];
    if (!(activeTab == null ? void 0 : activeTab.id)) {
      throw new Error("No active tab found");
    }
    if (!activeTab.url || !/^https?:\/\//.test(activeTab.url)) {
      throw new Error(
        `Invalid tab URL: ${activeTab.url ?? "undefined"} - can only redetect VINs on web pages`
      );
    }
    await handlePageChange(
      activeTab.id,
      activeTab.url,
      "redetect",
      message.source ?? "manual",
      true
    );
    await localStorageService.set("vinScanningInProgress", false);
    sendResponse({ success: true });
  }).catch((error2) => {
    logErrorWithActiveTabContext("Redetect VINs error", { error: error2 });
    void localStorageService.set("vinScanningInProgress", false);
    sendResponse({
      success: false,
      error: error2 instanceof Error ? error2.message : String(error2)
    });
  });
  return true;
}
var Context = /* @__PURE__ */ ((Context2) => {
  Context2["IMS"] = "IMS";
  Context2["CARGURUS"] = "CARGURUS";
  Context2["UNKNOWN"] = "UNKNOWN";
  return Context2;
})(Context || {});
const urlPatterns = [
  {
    name: "CarGurus Prod",
    pattern: /^https?:\/\/(?:www\.)?cargurus\.com\/.*/,
    context: "CARGURUS"
    /* CARGURUS */
  },
  {
    name: "CarGurus Staging",
    pattern: /^https?:\/\/(?:.*\.)?proxinator-na\.svc\.ue1\.site-dev\.c-gurus\.com\/.*/,
    context: "CARGURUS"
    /* CARGURUS */
  },
  {
    name: "CDK Global",
    pattern: /^https?:\/\/[^.]+\.vehicle\.connectcdk\.com\/.*inventory_search.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Reynolds & Reynolds",
    pattern: /^https?:\/\/app\.autovision\.com\/inventory\/list.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Dealertrack",
    pattern: /^https?:\/\/.*dealertrackdms\.app\.coxautoinc\.com\/.*\/inventory.*list.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Tekion",
    pattern: /^https?:\/\/app\.tekioncloud\.com\/inventory\/.*list.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "vAuto",
    pattern: /^https?:\/\/www2\.vauto\.com/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Autosoft",
    pattern: /^https?:\/\/dms\.autosoftdms\.com\/Vehicle.*List.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "DealerSocket",
    pattern: /^https?:\/\/inventory\.dealersocket\.com\/showroom\/\d+\/?$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Dealer.com",
    pattern: /^https?:\/\/apps\.dealer\.com\/.*\/inventory\/list.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "CarsForSale",
    pattern: /^https?:\/\/(?:www\\.)?myaccountcenter\\.com\/Inventory\/?$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "DealerCenter",
    pattern: /^https?:\/\/app\.dealercenter\.net\/apps\/inventory\/(list)\/?$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Dealer Car Search",
    pattern: /^https?:\/\/admin\.dealercarsearch\.com\/Inventory\/List.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "MAX Digital / FirstLook",
    pattern: /^https?:\/\/[^.]+\.firstlook\.com\/Inventory\/list.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Frazer Computing",
    pattern: /^https?:\/\/[^.]+\.frazer\.com\/Inventory\/list.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "AutoManager (DeskManager Online)",
    pattern: /^https?:\/\/dm\.automanager\.com\/Inventory\/List.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Dealerslink",
    pattern: /^https?:\/\/(\w+.)?dealerslink\.com\/inventory*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Autofunds",
    pattern: /^https?:\/\/www\.autofunds\.com\/Inventory\.aspx.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Dealer Inspire",
    pattern: /^https?:\/\/secure\.dealerinspire\.com\/inventory*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Predian (CDK/Redline spin-out)",
    pattern: /^https?:\/\/app\.predian\.ai\/inventory*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Dealer Specialties (VinMotion)",
    pattern: /^https?:\/\/vinmotion\.vehicledata\.com\/#\/inventory.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "DealerSync",
    pattern: /^https?:\/\/[^/]+\.dw\.dealersync\.com\/pre-owned-cars(\/[^/]+)?$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "V12 Software",
    pattern: /^https?:\/\/[^.]+\.v12software\.com\/Inventory\/list.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "Wayne Reaves",
    pattern: /^https?:\/\/[^.]+\.wayne-reaves\.com\/Inventory\/list.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "DealerOn",
    pattern: /^https?:\/\/account\.dealeron\.com\/InventoryManager\/.*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "VINcue (dealercue)",
    pattern: /^https?:\/\/pro\.vincue\.com\/Inventory\/List*$/,
    context: "IMS"
    /* IMS */
  },
  {
    name: "VinSolutions Connect (v2)",
    pattern: /^https?:\/\/connect\.vinsolutions\.com\/Inventory\/.*$/,
    context: "IMS"
    /* IMS */
  }
];
function detectContext(url = window.location.href) {
  const matchedPattern = urlPatterns.find((item2) => item2.pattern.test(url));
  return matchedPattern ? matchedPattern.context : Context.UNKNOWN;
}
chrome.runtime.onInstalled.addListener((details) => {
  initializeSentry();
  if (details.reason === "install" || details.reason === "update") {
    (async () => {
      try {
        await chrome.storage.local.remove([
          "accessToken",
          "refreshToken",
          "idToken",
          "expiresAt",
          "selectedVin",
          ALL_SERVICE_PROVIDERS_STORAGE_KEY,
          SERVICE_PROVIDER_ID_STORAGE_KEY,
          SELECTED_VEHICLE_INFO_KEY,
          DETECTED_VINS_STORAGE_KEY,
          "vinScanningInProgress",
          "updateAvailable",
          "updateVersion"
        ]);
      } catch (error2) {
        logError("Error clearing local storage on install/update:", error2);
      }
      try {
        await unregisterContentScripts();
        await registerContentScripts();
      } catch (error2) {
        logError("Error during content script registration:", error2);
      }
    })().catch((error2) => {
      logError("Error in onInstalled / onUpdate handler:", error2);
    });
  }
  if (details.reason === "install") {
    void (async () => {
      try {
        await localStorageService.set("isOnInstallAnalyticsReported", false);
      } catch (error2) {
        logError("Failed to set trackInstallEvent flag", error2);
      }
    })();
  }
  void checkLoginStatus();
});
chrome.runtime.onUpdateAvailable.addListener((details) => {
  void chrome.storage.local.set({
    updateAvailable: true,
    updateVersion: details.version
  }).then(() => {
    try {
      chrome.runtime.sendMessage({ action: "updateReady" });
    } catch {
    }
  });
});
chrome.runtime.requestUpdateCheck().catch(() => {
});
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    localStorageService.set("openSidePanelFrom", "extensionIcon");
    chrome.sidePanel.open({ tabId: tab.id }).catch((error2) => {
      logErrorWithTabContext("Failed to open side panel", tab.id, { error: error2 });
    });
  }
});
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sidePanelConnection") {
    port.onDisconnect.addListener(() => {
      localStorageService.remove("openSidePanelFrom");
    });
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlerMap = {
    checkLoginStatus: () => handleCheckLoginStatus(sendResponse),
    logout: () => handleLogout(sendResponse),
    initiateLogin: () => handleInitiateLogin(
      message,
      sendResponse
    ),
    openSidePanel: () => handleOpenSidePanel(
      message,
      sender,
      sendResponse
    ),
    openBackgroundLink: () => handleOpenBackgroundLink(
      message,
      sendResponse
    ),
    fetchPriceRecommendations: () => handleFetchPriceRecommendations(
      message,
      sendResponse
    ),
    fetchLeadPredictions: () => handleFetchLeadPredictions(
      message,
      sendResponse
    ),
    publishPrice: () => handlePublishPrice(
      message,
      sendResponse
    ),
    fetchServiceProviders: () => handleFetchServiceProviders(
      message,
      sendResponse
    ),
    saveVins: () => handleSaveVins(message, sendResponse),
    processDetectedVins: () => handleProcessDetectedVins(
      message,
      sender,
      sendResponse
    ),
    clearVinScanningFlag: () => handleClearVinScanningFlag(sendResponse),
    redetectVins: () => handleRedetectVins(
      message,
      sender,
      sendResponse
    ),
    // Car Values Tool handlers
    fetchDealerAccountInfo: () => handleFetchDealerAccountInfo(
      message,
      sendResponse
    ),
    fetchEngines: () => handleFetchEngines(
      message,
      sendResponse
    ),
    getTransmissions: () => handleGetTransmissions(
      message,
      sendResponse
    ),
    getTrims: () => handleGetTrims(message, sendResponse),
    getOptions: () => handleGetOptions(message, sendResponse),
    getExperianSummary: () => handleFetchExperianSummary(
      message,
      sendResponse
    ),
    fetchCVTNearbyListings: () => handleFetchCVTNearbyListings(
      message,
      sendResponse
    ),
    fetchFilterLists: () => handleFetchFilterLists(
      message,
      sendResponse
    ),
    getImvLookup: () => handleGetImvLookup(
      message,
      sendResponse
    ),
    fetchBookValues: () => handleFetchBookValues(
      message,
      sendResponse
    ),
    fetchMds: () => handleFetchMds(message, sendResponse),
    fetchFeeTaxBreakdown: () => handleFetchFeeTaxBreakdown(
      message,
      sendResponse
    ),
    fetchInventorySettings: () => handleFetchInventorySettings(
      message,
      sendResponse
    ),
    fetchNearbyListings: () => handleFetchNearbyListings(
      message,
      sendResponse
    ),
    fetchNearbyFilterLists: () => handleFetchNearbyFilterLists(
      message,
      sendResponse
    ),
    checkForUpdate: () => handleCheckForUpdate(sendResponse),
    applyUpdate: () => handleApplyUpdate(sendResponse)
  };
  const { action } = message;
  const handler = action in handlerMap ? handlerMap[action] : () => handleUnknownAction(message, sendResponse);
  return handler();
});
function getPathFromUrl(url) {
  return url.split(/[#?]/)[0];
}
function detectAndStoreContext(url) {
  localStorageService.set(
    "context",
    JSON.stringify({ url: getPathFromUrl(url), context: detectContext(url) })
  );
}
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId).then(async (tab) => {
    if (!isValidInjectionTarget(tab)) {
      logDebug(
        `Tab ${activeInfo.tabId} is not a valid injection target, skipping VIN detection`
      );
      return;
    }
    detectAndStoreContext(tab.url);
    await ensureContentScriptInjected(activeInfo.tabId);
    return handlePageChange(activeInfo.tabId, tab.url, "activation");
  }).catch((error2) => {
    if (error2 instanceof Error && (error2.message.includes("no URL") || error2.message.includes("cannot access a chrome:// URL"))) {
      logDebug("Expected case - tab not injectable:", error2.message);
    } else {
      logErrorWithTabContext(
        "Error getting active tab info for activation",
        activeInfo.tabId,
        {
          error: error2,
          windowId: activeInfo.windowId
        }
      );
    }
  });
});
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    (async () => {
      await ensureContentScriptInjected(details.tabId);
      detectAndStoreContext(details.url);
      void handleActiveTabNavigation(details.tabId, details.url, "on_completed");
    })().catch((error2) => {
      logErrorWithTabContext("Error handling navigation event", details.tabId, { error: error2 });
    });
  }
});
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0) {
    (async () => {
      await ensureContentScriptInjected(details.tabId);
      detectAndStoreContext(details.url);
      void handleActiveTabNavigation(details.tabId, details.url, "url_change");
    })().catch((error2) => {
      logErrorWithTabContext("Error handling SPA navigation", details.tabId, { error: error2 });
    });
  }
});
chrome.tabs.onRemoved.addListener((tabId) => {
  clearVinsForTab(tabId).catch((error2) => {
    logErrorWithTabContext("Error clearing VIN data for closed tab", tabId, { error: error2 });
  });
  clearTrackingDataForTab(tabId).catch((error2) => {
    logErrorWithTabContext("Error clearing tracking data for closed tab", tabId, { error: error2 });
  });
});
chrome.runtime.onSuspend.addListener(() => {
  void unregisterContentScripts();
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, { url }) => {
  if (changeInfo.status === "complete" && url) {
    (async () => {
      try {
        await ensureContentScriptInjected(tabId);
        void handleActiveTabNavigation(tabId, url, "tab_update");
      } catch (error2) {
        logErrorWithTabContext("Error handling tab update", tabId, { error: error2 });
      }
    })();
  }
});
