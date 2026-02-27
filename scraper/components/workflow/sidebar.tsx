"use client"

import {
  Globe,
  Database,
  Filter,
  Settings,
  Plug,
  Workflow,
  Server,
  Code,
  Grid3x3,
  DatabaseIcon,
  BookUserIcon as BrowserIcon,
  HelpCircle,
  Users,
  Play,
  Flag,
  MousePointer2,
  Clock,
  Type,
  Search,
  SquareFunction,
  Sigma,
  List,
  BookOpen,
  FileCode,
  GitBranch,
  Link,
  FileJson,
  FileText,
  Trash,
  Shield,
} from "lucide-react"





// ...existing code...
export const SIDEBAR_ACTIONS = {
  webscraping: [
    {   id: "click",
    section: "webscraping",
    label: "Click",
    description: "Click an element on the page",
    icon: MousePointer2, parameterSchema: {
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
    runtimeHints: { timeoutMs: 30_000, memoryMb: 256 }, },
    {
    id: "wait",
    section: "webscraping",
    label: "Wait",
    description: "Pause or wait for a condition",
    icon: Clock,
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
     {
    id: "write",
    section: "webscraping",
    label: "Write",
    description: "Type text into an element",
    icon: Type,
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
  {
    id: "solveAndPaginateHtml",
    section: "webscraping",
    label: "Solve Captcha + Paginate",
    description: "Solve captcha, submit form, and loop Next to gather records",
    icon: List,
    version: "1.0",
    parameterSchema: {
      title: "Solve and Paginate",
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string", default: "" },
        
        dateFrom: { type: "string", default: "" },
        dateTo: { type: "string", default: "" },
        pageSize: { type: "integer", default: 50 },
        maxPages: { type: "integer", default: 200 },
        maxRecords: { type: "integer", default: 10000 },
        solveCaptcha: { type: "boolean", default: true },
        captchaApiKey: { type: "string", default: "" },
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
          default: "image",
        },
        pageUrl: { type: "string", default: "" },
        siteKey: { type: "string", default: "" },
        score: { type: "number", default: 0.3 },
        gt: { type: "string", default: "" },
        challenge: { type: "string", default: "" },
        apiServer: { type: "string", default: "" },
        surl: { type: "string", default: "" },
        captchaUrl: { type: "string", default: "" },
        userAgent: { type: "string", default: "" },
        text: { type: "string", default: "" },
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
  {
    id: "solveCaptcha",
    section: "webscraping",
    label: "Solve Captcha (2Captcha)",
    description: "Solve common captcha types via 2Captcha",
    icon: Shield,
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
  {
    id: "solveOSCaptcha",
    section: "webscraping",
    label: "Solve Captcha (Open source)",
    description: "Solve common captcha types via Open source",
    icon: Shield,
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
          ],
          default: "normal",
        },
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
    {
    id: "useKey",
    section: "webscraping",
    label: "Use Key",
    description: "Send keyboard sequence",
    icon: SquareFunction,
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
    {
    id: "openBrowser",
    section: "webscraping",
    label: "Open Browser",
    description: "Launch a browser session",
    icon: Globe,
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


   {
    id: "loadWebsite",
    section: "webscraping",
    label: "Load Website",
    description: "Navigate to a URL",
    icon: Search,
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
    //    headers: { type: "object", default: {} },
        blockResources: { type: "array", items: { type: "string" }, default: ["image", "media"], description: "Resource types to block" },
      },
    },
    runtimeHints: { timeoutMs: 120_000, memoryMb: 512 },
  },

   {
    id: "refreshPageSource",
    section: "webscraping",
    label: "Refresh Page Source",
    description: "Get current HTML of the page",
    icon: FileCode,
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

   {
    id: "clickXPath",
    section: "webscraping",
    label: "Click XPath Element",
    description: "Click element by XPath",
    icon: MousePointer2,
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

   {
    id: "scanWebPage",
    section: "webscraping",
    label: "Scan Web Page",
    description: "Discover links, selectors and resources",
    icon: Search,
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

   {
    id: "extractXPath",
    section: "webscraping",
    label: "Extract XPath Element",
    description: "Extract text or attribute using XPath",
    icon: FileCode,
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

  {
    id: "extractMultipleXPaths",
    section: "webscraping",
    label: "Extract Multiple XPaths",
    description: "Extract multiple named xpaths into an object",
    icon: List,
    version: "1.0",
    parameterSchema: {
      title: "Extract Multiple XPaths",
      type: "object",
      required: ["xpaths"],
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
    runtimeHints: { timeoutMs: 60_000, memoryMb: 384 },
  },

  {
    id: "clickName",
    section: "webscraping",
    label: "Click Name Element",
    description: "Click element by name attribute",
    icon: MousePointer2,
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

{
    id: "clickId",
    section: "webscraping",
    label: "Click Id Element",
    description: "Click element by id",
    icon: MousePointer2,
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

{
    id: "getCurrentUrl",
    section: "webscraping",
    label: "Get Current URL",
    description: "Return current page URL",
    icon: Link,
    version: "1.0",
    parameterSchema: {
      title: "Get Current URL",
      type: "object",
      properties: { pageHandle: { type: "string", default: "" } },
    },
    runtimeHints: { timeoutMs: 5000, memoryMb: 64 },
  },

 {
    id: "closeBrowser",
    section: "webscraping",
    label: "Close Browser",
    description: "Close session and free resources",
    icon: Globe,
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



  ],
  datasources: [
  {
    id: "addDatabase",
    section: "datasources",
    label: "Add Database",
    description: "Add a new database connection",
    icon: Database,
    version: "1.0",
    parameterSchema: {
      title: "Add Database",
      type: "object",
      required: ["host", "port", "user", "password", "dbName"],
      properties: {
        host: { type: "string", description: "Database host", default: "" },
        port: { type: "integer", description: "Database port", default: 5432 },
        user: { type: "string", description: "Database user", default: "" },
        password: { type: "string", description: "Database password", default: "" },
        dbName: { type: "string", description: "Database name", default: "" },
        driver: { type: "string", enum: ["postgresql", "mysql", "sqlite"], default: "postgresql" },
        ssl: { type: "boolean", default: false },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 128 },
  },

   {
    id: "loadExcelCsv",
    section: "datasources",
    label: "Load Excel/CSV",
    description: "Load data from an Excel or CSV file",
    icon: FileJson,
    version: "1.0",
    parameterSchema: {
      title: "Load Excel/CSV",
      type: "object",
      required: ["filePath"],
      properties: {
        filePath: { type: "string", description: "Path to the file", default: "" },
        sheetName: { type: "string", description: "Sheet name (Excel only)", default: "" },
        delimiter: { type: "string", description: "CSV delimiter", default: "," },
        headerRow: { type: "boolean", default: true },
        encoding: { type: "string", default: "utf-8" },
      },
    },
    runtimeHints: { timeoutMs: 60_000, memoryMb: 256 },
  },

   {
    id: "saveExcelCsv",
    section: "datasources",
    label: "Save Excel/CSV",
    description: "Save data to an Excel or CSV file",
    icon: FileJson,
    version: "1.0",
    parameterSchema: {
      title: "Save Excel/CSV",
      type: "object",
      required: ["dataframeRef", "filePath"],
      properties: {
        dataframeRef: { type: "string", description: "Reference to the dataframe", default: "" },
        filePath: { type: "string", description: "Path to save the file", default: "" },
        delimiter: { type: "string", description: "CSV delimiter", default: "," },
        includeIndex: { type: "boolean", default: false },
        compression: { type: "boolean", default: false },
      },
    },
    runtimeHints: { timeoutMs: 60_000, memoryMb: 256 },
  },

   {
    id: "getApiRest",
    section: "datasources",
    label: "Get API (REST)",
    description: "Send a GET request to a REST API",
    icon: Link,
    version: "1.0",
    parameterSchema: {
      title: "Get API (REST)",
      type: "object",
      required: ["url"],
      properties: {
        url: { type: "string", description: "API endpoint URL", default: "" },
        headers: { type: "object", description: "Request headers", default: {} },
        queryParams: { type: "object", description: "Query parameters", default: {} },
        timeoutMs: { type: "integer", default: 30_000 },
      },
    },
    runtimeHints: { timeoutMs: 60_000, memoryMb: 128 },
  },

  {
    id: "postApiRest",
    section: "datasources",
    label: "Post API (REST)",
    description: "Send a POST request to a REST API",
    icon: Link,
    version: "1.0",
    parameterSchema: {
      title: "Post API (REST)",
      type: "object",
      required: ["url", "body"],
      properties: {
        url: { type: "string", description: "API endpoint URL", default: "" },
        headers: { type: "object", description: "Request headers", default: {} },
        body: { type: "object", description: "Request body", default: {} },
        timeoutMs: { type: "integer", default: 30_000 },
      },
    },
    runtimeHints: { timeoutMs: 60_000, memoryMb: 128 },
  },

   {
    id: "loadJsonFile",
    section: "datasources",
    label: "Load JSON File",
    description: "Load data from a JSON file",
    icon: FileJson,
    version: "1.0",
    parameterSchema: {
      title: "Load JSON File",
      type: "object",
      required: ["filePath"],
      properties: {
        filePath: { type: "string", description: "Path to the JSON file", default: "" },
        schemaValidate: { type: "boolean", default: false },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 128 },
  },

   {
    id: "saveJsonFile",
    section: "datasources",
    label: "Save JSON File",
    description: "Save data to a JSON file",
    icon: FileJson,
    version: "1.0",
    parameterSchema: {
      title: "Save JSON File",
      type: "object",
      required: ["dataframeRef", "filePath"],
      properties: {
        dataframeRef: { type: "string", description: "Reference to the dataframe", default: "" },
        filePath: { type: "string", description: "Path to save the file", default: "" },
        prettyPrint: { type: "boolean", default: true },
      },
    },
    runtimeHints: { timeoutMs: 30_000, memoryMb: 128 },
  },
  ],
cleaning: [
  {
    id: "dropColumn",
    section: "cleaning",
    label: "Drop Column",
    description: "Remove one or more columns from dataframe",
    icon: Filter,
    parameterSchema: {
      title: "Drop Column",
      type: "object",
      required: ["dataframeRef", "columns"],
      properties: {
        dataframeRef: { type: "string", description: "Input dataframe reference" },
        columns: {
          type: "array",
          items: { type: "string" },
          description: "Columns to remove",
        },
      },
    },
  },

  {
    id: "renameColumn",
    section: "cleaning",
    label: "Rename Column",
    icon: Filter,
    parameterSchema: {
      title: "Rename Column",
      type: "object",
      required: ["dataframeRef", "mapping"],
      properties: {
        dataframeRef: { type: "string" },
        mapping: {
          type: "object",
          description: "oldName → newName",
        },
      },
    },
  },

  {
    id: "selectColumns",
    section: "cleaning",
    label: "Select Columns",
    icon: Filter,
    parameterSchema: {
      title: "Select Columns",
      type: "object",
      required: ["dataframeRef", "columns"],
      properties: {
        dataframeRef: { type: "string" },
        columns: { type: "array", items: { type: "string" } },
      },
    },
  },

  {
    id: "addConstantColumn",
    section: "cleaning",
    label: "Add Constant Column",
    icon: Filter,
    parameterSchema: {
      title: "Add Constant Column",
      type: "object",
      required: ["dataframeRef", "columnName", "value"],
      properties: {
        dataframeRef: { type: "string" },
        columnName: { type: "string" },
        value: { type: ["string", "number", "boolean"] },
      },
    },
  },

  {
    id: "replaceString",
    section: "cleaning",
    label: "Replace String",
    icon: Filter,
    parameterSchema: {
      title: "Replace String",
      type: "object",
      required: ["dataframeRef", "column", "search", "replace"],
      properties: {
        dataframeRef: { type: "string" },
        column: { type: "string" },
        search: { type: "string" },
        replace: { type: "string" },
        regex: { type: "boolean", default: false },
      },
    },
  },

  {
    id: "searchString",
    section: "cleaning",
    label: "Search String",
    icon: Search,
    parameterSchema: {
      title: "Search String",
      type: "object",
      required: ["dataframeRef", "column", "query"],
      properties: {
        dataframeRef: { type: "string" },
        column: { type: "string" },
        query: { type: "string" },
        caseSensitive: { type: "boolean", default: false },
      },
    },
  },

  {
    id: "filterString",
    section: "cleaning",
    label: "Filter String Data",
    icon: Filter,
    parameterSchema: {
      title: "Filter String Data",
      type: "object",
      required: ["dataframeRef", "column", "operator", "value"],
      properties: {
        dataframeRef: { type: "string" },
        column: { type: "string" },
        operator: {
          type: "string",
          enum: ["contains", "equals", "startsWith", "endsWith"],
        },
        value: { type: "string" },
      },
    },
  },

  {
    id: "splitString",
    section: "cleaning",
    label: "Split String Data",
    icon: Filter,
    parameterSchema: {
      title: "Split String",
      type: "object",
      required: ["dataframeRef", "column", "delimiter"],
      properties: {
        dataframeRef: { type: "string" },
        column: { type: "string" },
        delimiter: { type: "string" },
        newColumns: { type: "array", items: { type: "string" } },
      },
    },
  },

  {
    id: "sortData",
    section: "cleaning",
    label: "Sort Data",
    icon: Filter,
    parameterSchema: {
      title: "Sort Data",
      type: "object",
      required: ["dataframeRef", "by"],
      properties: {
        dataframeRef: { type: "string" },
        by: { type: "array", items: { type: "string" } },
        order: { type: "string", enum: ["asc", "desc"], default: "asc" },
      },
    },
  },

  {
    id: "removeDuplicates",
    section: "cleaning",
    label: "Remove Duplicates",
    icon: Filter,
    parameterSchema: {
      title: "Remove Duplicates",
      type: "object",
      required: ["dataframeRef"],
      properties: {
        dataframeRef: { type: "string" },
        subset: { type: "array", items: { type: "string" } },
      },
    },
  },

  {
    id: "removeEmptyRows",
    section: "cleaning",
    label: "Remove Empty Rows",
    icon: Filter,
    parameterSchema: {
      title: "Remove Empty Rows",
      type: "object",
      required: ["dataframeRef"],
      properties: {
        dataframeRef: { type: "string" },
        how: { type: "string", enum: ["any", "all"], default: "any" },
      },
    },
  },

  {
    id: "knnImputation",
    section: "cleaning",
    label: "KNN Imputation",
    icon: Filter,
    parameterSchema: {
      title: "KNN Imputation",
      type: "object",
      required: ["dataframeRef", "columns"],
      properties: {
        dataframeRef: { type: "string" },
        columns: { type: "array", items: { type: "string" } },
        k: { type: "integer", default: 5 },
      },
    },
    runtimeHints: { memoryMb: 512 },
  },
],
control: [
  {
    id: "start",
    section: "control",
    label: "Start",
    icon: Play,
  },

  {
    id: "finish",
    section: "control",
    label: "Finish",
    icon: Flag,
  },

  {
    id: "addVariable",
    section: "control",
    label: "Add New Variable",
    icon: Database,
    parameterSchema: {
      title: "Add Variable",
      type: "object",
      required: ["name", "value"],
      properties: {
        name: { type: "string" },
        value: { type: ["string", "number", "boolean", "object", "array"] },
      },
    },
  },

  {
    id: "convertVariable",
    section: "control",
    label: "Convert Variable Type",
    icon: GitBranch,
    parameterSchema: {
      title: "Convert Variable",
      type: "object",
      required: ["variable", "toType"],
      properties: {
        variable: { type: "string" },
        toType: { type: "string", enum: ["string", "number", "boolean"] },
      },
    },
  },

  {
    id: "mathModify",
    section: "control",
    label: "Math Modify Variable",
    icon: Sigma,
    parameterSchema: {
      title: "Math Modify",
      type: "object",
      required: ["variable", "operation", "value"],
      properties: {
        variable: { type: "string" },
        operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
        value: { type: "number" },
      },
    },
  },

  {
    id: "ifCondition",
    section: "control",
    label: "If Condition",
    icon: GitBranch,
    parameterSchema: {
      title: "If Condition",
      type: "object",
      required: ["left", "operator", "right"],
      properties: {
        left: { type: ["string", "number"] },
        operator: { type: "string", enum: ["==", "!=", ">", "<", ">=", "<="] },
        right: { type: ["string", "number"] },
      },
    },
  },

  {
    id: "printVariable",
    section: "control",
    label: "Print Variable",
    icon: FileText,
    parameterSchema: {
      title: "Print Variable",
      type: "object",
      required: ["variable"],
      properties: {
        variable: { type: "string" },
      },
    },
  },

  {
    id: "loadPythonScript",
    section: "control",
    label: "Load Python Script",
    icon: Code,
    parameterSchema: {
      title: "Load Python Script",
      type: "object",
      required: ["code"],
      properties: {
        code: { type: "string", description: "Python code to execute" },
      },
    },
    runtimeHints: { timeoutMs: 10000, trusted: false },
  },
],integrations: [
    {
    id: "connectMongo",
    section: "integrations",
    label: "Connect MongoDB",
    description: "Connect to a MongoDB database",
    icon: Database,
    version: "1.0",
    parameterSchema: {
      title: "MongoDB Connection",
      type: "object",
      required: ["connectionConfig"],
      properties: {
        connectionConfig: {
          type: "object",
          required: ["uri"],
          properties: {
            uri: {
              type: "string",
              default: "mongodb://localhost:27017",
            },
          },
        },
      },
    },
  },

  {
    id: "insertMongo",
    section: "integrations",
    label: "Insert Document (MongoDB)",
    icon: Database,
    parameterSchema: {
      title: "Insert Mongo Document",
      type: "object",
      required: ["database", "collection", "document"],
      properties: {
        database: { type: "string" },
        collection: { type: "string" },
        document: { type: "object" },
      },
    },
  },

  {
    id: "deleteMongo",
    section: "integrations",
    label: "Delete Document (MongoDB)",
    icon: Trash,
    parameterSchema: {
      title: "Delete Mongo Document",
      type: "object",
      required: ["database", "collection", "filter"],
      properties: {
        database: { type: "string" },
        collection: { type: "string" },
        filter: { type: "object" },
      },
    },
  },
  {
    id: "connectMilvus",
    section: "integrations",
    label: "Connect Milvus",
    description: "Connect to Milvus vector database",
    icon: Database,
    version: "1.0",
    parameterSchema: {
      title: "Milvus Connection",
      type: "object",
      required: ["connectionConfig"],
      properties: {
        connectionConfig: {
          type: "object",
          required: ["host", "port"],
          properties: {
            host: { type: "string", default: "localhost" },
            port: { type: "integer", default: 19530 },
          },
        },
      },
    },
  },

  {
    id: "insertMilvus",
    section: "integrations",
    label: "Insert Vectors (Milvus)",
    icon: Database,
    parameterSchema: {
      title: "Insert Milvus Vectors",
      type: "object",
      required: ["collection", "data"],
      properties: {
        collection: { type: "string" },
        data: {
          type: "array",
          description: "Array of vectors/entities",
          items: { type: "object" },
        },
      },
    },
  },

  {
    id: "deleteMilvus",
    section: "integrations",
    label: "Delete Vectors (Milvus)",
    icon: Trash,
    parameterSchema: {
      title: "Delete Milvus Vectors",
      type: "object",
      required: ["collection", "expr"],
      properties: {
        collection: { type: "string" },
        expr: {
          type: "string",
          description: "Milvus delete expression (e.g. id in [1,2,3])",
        },
      },
    },
  },

{
  id: "analyzeSite",
  section: "integrations",
  label: "Analyze Website",
  description: "Detect if a site is JS-heavy, has robots.txt, or CAPTCHA signals",
  icon: Globe, // choose any icon you use (e.g. Globe, Search, Scan)
  version: "1.0",
  parameterSchema: {
    title: "Website Analysis",
    type: "object",
    required: ["rootUrl"],
    properties: {
      rootUrl: {
        type: "string",
        default: "https://example.com"
      },
      timeoutMs: {
        type: "integer",
        default: 12000
      }
    }
  }
},




{
  id: "scrapeJsSite",
  section: "integrations",
  label: "Scrape JS Site",
  description: "Crawl a JS-rendered website using Playwright (stops if CAPTCHA detected)",
  icon: Globe,
  version: "1.0",
  parameterSchema: {
    title: "JS Website Crawler (Playwright)",
    type: "object",
    required: ["rootUrl"],
    properties: {
      rootUrl: {
        type: "string",
        default: "https://example.com"
      },
      maxPages: {
        type: "integer",
        default: 30
      },
      maxDepth: {
        type: "integer",
        default: 2
      },
      sameDomainOnly: {
        type: "boolean",
        default: true
      },
      respectRobotsTxt: {
        type: "boolean",
        default: true
      },
      timeoutMs: {
        type: "integer",
        default: 20000
      }
    }
  }
}
,
{
  id: "fetchText",
  section: "integrations",
  label: "Fetch Page Text",
  description: "Fetch a webpage HTML and extract readable visible text (for AI analysis)",
  icon: Globe, // or FileText / Scan / Search depending on your icon set
  version: "1.0",
  parameterSchema: {
    title: "Fetch Page Text",
    type: "object",
    required: ["url"],
    properties: {
      url: {
        type: "string",
        default: "https://example.com"
      },
      timeoutMs: {
        type: "integer",
        default: 12000
      },
      maxChars: {
        type: "integer",
        default: 30000,
        description: "Maximum characters of extracted text to return"
      }
    }
  }
  
}

,{
  id: "pdfTomarkdown",
  section: "integrations",
  label: "Convert PDF to Markdown",
  description: "Convert a PDF (URL or local path) into Markdown using Docling",
  icon: FileText, // choose whatever icon you have
  version: "1.0",
  parameterSchema: {
    title: "Docling PDF → Markdown",
    type: "object",
    required: ["source"],
    properties: {
      source: { type: "string", default: "https://arxiv.org/pdf/2408.09869" },
      maxChars: { type: "integer", default: 30000 },
      returnMarkdown: { type: "boolean", default: true }
    }
  }
}



]

}
// ...existing code...
type SidebarItem = {
  id: string
  name: string
  icon: React.ComponentType<any>
  badge?: string
  iconColor?: string
  disabled?: boolean
}

type SidebarSection = {
  title: string
  items: SidebarItem[]
  disabled?: boolean
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "BUILD",
    items: [
      { id: "webscraping", name: "WEBSCRAPING & RPA", icon: Globe },
      { id: "datasources", name: "DATA SOURCES", icon: Database },
      { id: "cleaning", name: "CLEANING", icon: Filter },
      { id: "control", name: "CONTROL", icon: Settings },
      { id: "integrations", name: "INTEGRATIONS", icon: Plug },
    ],
  },
  {
    title: "ORCHESTRATE",
    items: [
      { id: "pipelines", name: "PIPELINES", icon: Workflow },
      { id: "machines", name: "MACHINES (BETA)", icon: Server, badge: "Beta" },
    ],
  },
  {
    title: "SCHEDULE",
    items: [],
  },
  {
    title: "VIEW",
    items: [
      { id: "codeview", name: "CODE VIEW", icon: Code, iconColor: "text-blue-600" },
      { id: "datagrid", name: "DATA GRID VIEW", icon: Grid3x3 },
      { id: "database", name: "DATABASE VIEW", icon: DatabaseIcon },
      { id: "browser", name: "BROWSER VIEW", icon: BrowserIcon },
    ],
  },
  {
    title: "ANALYZE (In next version)",
    disabled: true,
    items: [
      { id: "monitoring", name: "MONITORING", icon: HelpCircle, disabled: true },
      { id: "collaboration", name: "TEAM COLLABORATION", icon: Users, disabled: true },
    ],
  },
]
export function WorkflowSidebar({
  expandedItem,
  setExpandedItem,
}: {
  expandedItem: string | null
  setExpandedItem: any
  //: (id: string | null) => void
}) {
  return (
    <aside className="w-56 border-r border-(--forloop-border) bg-white flex flex-col overflow-y-auto relative z-30">
      <div className="flex flex-col gap-6 py-6">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className={section.disabled ? "opacity-30" : ""}>
            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 px-5">
              {section.title}
            </h3>
            <div className="flex flex-col">
              {section.items.map((item) => (
                <div key={item.id} className="relative">
                  <button
                    disabled={item.disabled}
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-[13px] transition-all text-left group ${
                      item.disabled ? "cursor-not-allowed" : "active:bg-gray-200"
                    } ${expandedItem === item.id ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <item.icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${item.iconColor || "text-gray-500 group-hover:text-gray-900"}`}
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 flex-1 font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium uppercase">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}




// This is the absolute menu panel
export function WorkflowMenuPanel({
  expandedItem,
  setExpandedItem,
    onActionClick
}: {
  expandedItem: string | null
  setExpandedItem:any
  // (id: string | null) => void
   onActionClick: (action: any) => void
}) {
  if (!expandedItem || !SIDEBAR_ACTIONS[expandedItem as keyof typeof SIDEBAR_ACTIONS]) return null
  const actions = SIDEBAR_ACTIONS[expandedItem as keyof typeof SIDEBAR_ACTIONS]

  return (
    <div
      className="fixed top-16 left-[10%] w-80 h-125 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 flex flex-col"
      style={{ minHeight: 400 }}
    >
      <div className="p-4 text-[13px] font-bold text-gray-700 border-b border-gray-100 flex justify-between items-center">
        Menu
        <button
          onClick={() => setExpandedItem(null)}
          className="text-gray-400 hover:text-gray-600 transition-colors font-bold text-lg leading-none"
        >
          ×
        </button>
      </div>
      <div className="overflow-y-auto flex-1 p-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
                onClick={() => {onActionClick(action)


                }}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded transition-all group/action text-gray-700 hover:bg-gray-100"
          >
            <action.icon className="w-5 h-5 text-gray-400 group-hover/action:text-gray-600 transition-colors" />
            <span className="flex-1 text-left">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
