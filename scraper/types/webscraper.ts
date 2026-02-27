export type ActionSection = "webscraping" | "datasources" | "cleaning" | "control"

export type JsonSchemaType = "string" | "number" | "boolean" | "object" | "array" | "integer"

export type ParameterSchema = {
  title?: string
  description?: string
  type: JsonSchemaType | JsonSchemaType[]
  properties?: {
    [key: string]: ParameterSchema & { enum?: any[]; default?: any }
  }
  required?: string[]
  enum?: any[]
  default?: any
  items?: ParameterSchema // Added to support array item schemas
}

export interface ActionTemplate {
  id: string
  section: ActionSection
  label: string
  description?: string
  icon?: string
  parameterSchema?: ParameterSchema
  runtimeHints?: { timeoutMs?: number; memoryMb?: number; trusted?: boolean }
  version?: string
}

export interface Node {
  id: string
  workflowId?: string
  type: "trigger" | "action" | "logic" | "finish"
  variant?: ActionSection | string | null
  label: string
  x: number
  y: number
  icon?: string
  actionTemplateId?: string
  inputs?: Record<string, any> // configured parameter values
  outputs?: Record<string, any>
  meta?: Record<string, any>
  status?: "idle" | "running" | "success" | "failed"
config: any
}


/**
 * Webscraping / RPA action templates (parameterSchema drives UI + server validation)
 */
export const WEBSCRAPING_TEMPLATES: Record<string, ActionTemplate> = {
  click: {
    id: "click",
    section: "webscraping",
    label: "Click",
    description: "Click an element on the page",
    icon: "MousePointer2",
    version: "1.0",
    parameterSchema: {
      title: "Click",
      type: "object",
      required: ["selector"],
      properties: {
        pageHandle: { type: "string", description: "Existing page handle id", default: "" },
        selector: { type: "string", description: "css selector | xpath | id | name", default: "" },
        selectorType: { type: "string", enum: ["css", "xpath", "id", "name"], default: "css" },
        clickType: { type: "string", enum: ["left", "right", "double"], default: "left" },
        timeoutMs: { type: "integer", default: 10000 },
        waitForSelectorBeforeMs: { type: "integer", default: 2000 },
        retryAttempts: { type: "integer", default: 0 },
        scrollIntoView: { type: "boolean", default: true },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 256 },
  },

  wait: {
    id: "wait",
    section: "webscraping",
    label: "Wait",
    description: "Pause or wait for a condition",
    icon: "Clock",
    version: "1.0",
    parameterSchema: {
      title: "Wait",
      type: "object",
      required: ["durationMs"],
      properties: {
        durationMs: { type: "integer", default: 1000, description: "Milliseconds to sleep" },
        conditionSelector: { type: "string", default: "", description: "Optional selector to wait for" },
        timeoutMs: { type: "integer", default: 30000 },
      },
    },
    runtimeHints: { timeoutMs: 60_000, memoryMb: 64 },
  },

  write: {
    id: "write",
    section: "webscraping",
    label: "Write",
    description: "Type text into an element",
    icon: "Type",
    version: "1.0",
    parameterSchema: {
      title: "Write",
      type: "object",
      required: ["selector", "text"],
      properties: {
        pageHandle: { type: "string", default: "" },
        selector: { type: "string", default: "" },
        selectorType: { type: "string", enum: ["css", "xpath", "id", "name"], default: "css" },
        text: { type: "string", default: "" },
        clearBefore: { type: "boolean", default: true },
        delayBetweenKeysMs: { type: "integer", default: 10 },
        submitAfter: { type: "boolean", default: false },
        timeoutMs: { type: "integer", default: 10000 },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 256 },
  },

  useKey: {
    id: "useKey",
    section: "webscraping",
    label: "Use Key",
    description: "Send keyboard sequence",
    icon: "SquareFunction",
    version: "1.0",
    parameterSchema: {
      title: "Use Key",
      type: "object",
      required: ["keySequence"],
      properties: {
        pageHandle: { type: "string", default: "" },
        keySequence: { type: "string", description: "E.g. Control+S or Enter", default: "" },
        selector: { type: "string", default: "" },
        holdDurationMs: { type: "integer", default: 100 },
        repeat: { type: "integer", default: 1 },
        timeoutMs: { type: "integer", default: 5000 },
      },
    },
    runtimeHints: { timeoutMs: 15_000, memoryMb: 128 },
  },

  openBrowser: {
    id: "openBrowser",
    section: "webscraping",
    label: "Open Browser",
    description: "Launch a browser session",
    icon: "Globe",
    version: "1.0",
    parameterSchema: {
      title: "Open Browser",
      type: "object",
      properties: {
        browserType: { type: "string", enum: ["chromium", "firefox", "webkit"], default: "chromium" },
        headless: { type: "boolean", default: true },
        viewportWidth: { type: "integer", default: 1280 },
        viewportHeight: { type: "integer", default: 720 },
        userAgent: { type: "string", default: "" },
        proxyId: { type: "string", default: "" },
      },
    },
    runtimeHints: { timeoutMs: 60_000, memoryMb: 512, trusted: false },
  },

  loadWebsite: {
    id: "loadWebsite",
    section: "webscraping",
    label: "Load Website",
    description: "Navigate to a URL",
    icon: "Search",
    version: "1.0",
    parameterSchema: {
      title: "Load Website",
      type: "object",
      required: ["url"],
      properties: {
        pageHandle: { type: "string", default: "" },
        url: { type: "string", default: "" },
        timeoutMs: { type: "integer", default: 30000 },
        waitUntil: { type: "string", enum: ["load", "domcontentloaded", "networkidle"], default: "networkidle" },
        headers: { type: "object", default: {} },
        blockResources: { type: "array", items: { type: "string" }, default: ["image", "media"], description: "Resource types to block" },
      },
    },
    runtimeHints: { timeoutMs: 120_000, memoryMb: 512 },
  },

  refreshPageSource: {
    id: "refreshPageSource",
    section: "webscraping",
    label: "Refresh Page Source",
    description: "Get current HTML of the page",
    icon: "FileCode",
    version: "1.0",
    parameterSchema: {
      title: "Refresh Page Source",
      type: "object",
      properties: {
        pageHandle: { type: "string", default: "" },
        cachePolicy: { type: "string", enum: ["no-cache", "default"], default: "default" },
        timeoutMs: { type: "integer", default: 10000 },
        maxSize: { type: "integer", default: 200000 },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 256 },
  },

  clickXPath: {
    id: "clickXPath",
    section: "webscraping",
    label: "Click XPath Element",
    description: "Click element by XPath",
    icon: "MousePointer2",
    version: "1.0",
    parameterSchema: {
      title: "Click XPath",
      type: "object",
      required: ["xpath"],
      properties: {
        pageHandle: { type: "string", default: "" },
        xpath: { type: "string", default: "" },
        timeoutMs: { type: "integer", default: 10000 },
        scrollIntoView: { type: "boolean", default: true },
        retryAttempts: { type: "integer", default: 0 },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 256 },
  },

  scanWebPage: {
    id: "scanWebPage",
    section: "webscraping",
    label: "Scan Web Page",
    description: "Discover links, selectors and resources",
    icon: "Search",
    version: "1.0",
    parameterSchema: {
      title: "Scan Web Page",
      type: "object",
      properties: {
        pageHandle: { type: "string", default: "" },
        scanRules: { type: "object", default: {} },
        depthLimit: { type: "integer", default: 1 },
        includeFrames: { type: "boolean", default: false },
        maxResources: { type: "integer", default: 100 },
      },
    },
    runtimeHints: { timeoutMs: 60_000, memoryMb: 384 },
  },

  extractXPath: {
    id: "extractXPath",
    section: "webscraping",
    label: "Extract XPath Element",
    description: "Extract text or attribute using XPath",
    icon: "FileCode",
    version: "1.0",
    parameterSchema: {
      title: "Extract XPath",
      type: "object",
      required: ["xpath"],
      properties: {
        pageHandle: { type: "string", default: "" },
        xpath: { type: "string", default: "" },
        attribute: { type: "string", enum: ["text", "href", "src", "attr"], default: "text" },
        attrName: { type: "string", default: "" },
        multiple: { type: "boolean", default: false },
        trim: { type: "boolean", default: true },
        maxSize: { type: "integer", default: 100000 },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 256 },
  },

  extractMultipleXPaths: {
    id: "extractMultipleXPaths",
    section: "webscraping",
    label: "Extract Multiple XPaths",
    description: "Extract multiple named xpaths into an object",
    icon: "List",
    version: "1.0",
    parameterSchema: {
      title: "Extract Multiple XPaths",
      type: "object",
      required: ["xpaths"],
      properties: {
        pageHandle: { type: "string", default: "" },
        xpaths: { type: "object", default: {}, description: "map name->xpath" },
        concurrencyLimit: { type: "integer", default: 4 },
        outputFlatten: { type: "boolean", default: false },
        maxItemSize: { type: "integer", default: 100000 },
      },
    },
    runtimeHints: { timeoutMs: 60_000, memoryMb: 384 },
  },

  clickName: {
    id: "clickName",
    section: "webscraping",
    label: "Click Name Element",
    description: "Click element by name attribute",
    icon: "MousePointer2",
    version: "1.0",
    parameterSchema: {
      title: "Click Name",
      type: "object",
      required: ["elementName"],
      properties: {
        pageHandle: { type: "string", default: "" },
        elementName: { type: "string", default: "" },
        formIndex: { type: "integer", default: 0 },
        timeoutMs: { type: "integer", default: 10000 },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 128 },
  },

  clickId: {
    id: "clickId",
    section: "webscraping",
    label: "Click Id Element",
    description: "Click element by id",
    icon: "MousePointer2",
    version: "1.0",
    parameterSchema: {
      title: "Click Id",
      type: "object",
      required: ["elementId"],
      properties: {
        pageHandle: { type: "string", default: "" },
        elementId: { type: "string", default: "" },
        timeoutMs: { type: "integer", default: 10000 },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 128 },
  },

  getCurrentUrl: {
    id: "getCurrentUrl",
    section: "webscraping",
    label: "Get Current URL",
    description: "Return current page URL",
    icon: "Link",
    version: "1.0",
    parameterSchema: {
      title: "Get Current URL",
      type: "object",
      properties: { pageHandle: { type: "string", default: "" } },
    },
    runtimeHints: { timeoutMs: 5000, memoryMb: 64 },
  },

  closeBrowser: {
    id: "closeBrowser",
    section: "webscraping",
    label: "Close Browser",
    description: "Close session and free resources",
    icon: "Globe",
    version: "1.0",
    parameterSchema: {
      title: "Close Browser",
      type: "object",
      properties: {
        browserSessionId: { type: "string", default: "" },
        forceClose: { type: "boolean", default: false },
      },
    },
    runtimeHints: { timeoutMs: 10_000, memoryMb: 64 },
  },

  solveAndPaginateHtml: {
    id: "solveAndPaginateHtml",
    section: "webscraping",
    label: "Solve Captcha + Paginate",
    description: "Handle captcha, submit form, and paginate through listings",
    icon: "List",
    version: "1.0",
    parameterSchema: {
      title: "Solve and Paginate",
      type: "object",
      required: ["url", "sessionId"],
      properties: {
        url: { type: "string", description: "Listing/search URL", default: "" },
        sessionId: { type: "string", description: "Browser session id (from openBrowser)", default: "" },
        dateFrom: { type: "string", default: "" },
        dateTo: { type: "string", default: "" },
        pageSize: { type: "integer", default: 50 },
        maxPages: { type: "integer", default: 200 },
        maxRecords: { type: "integer", default: 10000 },
        solveCaptcha: { type: "boolean", default: true },
        captchaApiKey: { type: "string", default: "" },
        followPagination: { type: "boolean", default: true },
        selectors: {
          type: "object",
          properties: {
            rowsSelector: { type: "string", default: "table tr" },
            nextSelector: { type: "string", default: "" },
            submitSelector: { type: "string", default: "" },
            captchaImageSelector: { type: "string", default: "" },
            captchaInputSelector: { type: "string", default: "" },
            formFields: { type: "object", default: {} },
          },
        },
      },
    },
    runtimeHints: { timeoutMs: 180_000, memoryMb: 512 },
  },

  solveCaptcha: {
    id: "solveCaptcha",
    section: "webscraping",
    label: "Solve Captcha (2Captcha)",
    description: "Solve common captcha types via 2Captcha",
    icon: "Shield",
    version: "1.0",
    parameterSchema: {
      title: "Solve Captcha",
      type: "object",
      required: ["captchaType"],
      properties: {
        captchaType: {
          type: "string",
          enum: [
            "image",
            "normal",
            "number",
            "text",
            "math",
            "recaptcha_v2",
            "recaptcha_v2_invisible",
            "recaptcha_v2_callback",
            "recaptcha_v3",
            "turnstile",
            "geetest",
            "funcaptcha",
            "hcaptcha",
            "keycaptcha",
            "capy",
            "datadome",
            "textcaptcha",
          ],
          default: "normal",
        },
        captchaApiKey: { type: "string", default: "" },
        pageUrl: { type: "string", default: "" },
        siteKey: { type: "string", default: "" },
        imagePath: { type: "string", default: "" },
        imageBase64: { type: "string", default: "" },
        imageSelector: { type: "string", default: "" },
        score: { type: "number", default: 0.3 },
        gt: { type: "string", default: "" },
        challenge: { type: "string", default: "" },
        apiServer: { type: "string", default: "" },
        surl: { type: "string", default: "" },
        captchaUrl: { type: "string", default: "" },
        userAgent: { type: "string", default: "" },
        text: { type: "string", default: "" },
        s_s_c_user_id: { type: "string", default: "" },
        s_s_c_session_id: { type: "string", default: "" },
        s_s_c_web_server_sign: { type: "string", default: "" },
        s_s_c_web_server_sign2: { type: "string", default: "" },
      },
    },
    runtimeHints: { timeoutMs: 180_000, memoryMb: 256 },
  },
}

export default WEBSCRAPING_TEMPLATES







//   cleaning: [
//     { icon: Filter, label: "Drop Column" },
//     { icon: Filter, label: "Rename Column" },
//     { icon: Filter, label: "Select Columns" },
//     { icon: Filter, label: "Add Constant Column" },
//     { icon: Filter, label: "Replace String" },
//     { icon: Search, label: "Search String" },
//     { icon: Filter, label: "Filter String Data" },
//     { icon: Filter, label: "Split String Data" },
//     { icon: Filter, label: "Sort Data" },
//     { icon: Filter, label: "Detect or Remove Out" },
//     { icon: Filter, label: "Remove Duplicates" },
//     { icon: Filter, label: "Remove Empty Rows" },
//     { icon: Filter, label: "Find Difference in Data" },
//     { icon: Filter, label: "Column-Wise Shift" },
//     { icon: Filter, label: "KNN Imputation" },
//   ],
//   control: [
//     { icon: Play, label: "Start" },
//     { icon: Flag, label: "Finish" },
//     { icon: Database, label: "Add New Variable" },
//     { icon: GitBranch, label: "Convert Variable Type" },
//     { icon: Sigma, label: "Math Modify Variable" },
//     { icon: Type, label: "String Modify Variable" },
//     { icon: List, label: "List Modify Variable" },
//     { icon: BookOpen, label: "Dictionary Modify Variable" },
//     { icon: GitBranch, label: "If Condition" },
//     { icon: FileText, label: "Print Variable" },
//     { icon: Code, label: "Load Python Script" },
//     { icon: FileCode, label: "Load Jupyter Script" },
//     { icon: SquareFunction, label: "Define Function" },
//     { icon: SquareFunction, label: "Define Lambda Function" },
//     { icon: Play, label: "Run Function" },
//   ],
