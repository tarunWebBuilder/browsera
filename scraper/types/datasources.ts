import { ActionTemplate } from "./webscraper";

//   datasources: [
//     { icon: Database, label: "Add Database" },
//     { icon: Database, label: "Add SQL Server DB" },
//     { icon: Database, label: "Add MySQL DB" },
//     { icon: FileJson, label: "Load Excel/CSV" },
//     { icon: FileJson, label: "Save Excel/CSV" },
//     { icon: Link, label: "Get API (REST)" },
//     { icon: Link, label: "Post API (REST)" },
//     { icon: Link, label: "Delete API (REST)" },
//     { icon: Link, label: "Put API (REST)" },
//     { icon: List, label: "Dataframe to List" },
//     { icon: Database, label: "List to Dataframe" },
//     { icon: FileText, label: "Load Txt File" },
//     { icon: FileText, label: "Save Txt File" },
//     { icon: FileJson, label: "Load Json File" },
//     { icon: FileJson, label: "Save Json File" },
//   ],




export const DATASOURCES_TEMPLATES: Record<string, ActionTemplate> = {
  addDatabase: {
    id: "addDatabase",
    section: "datasources",
    label: "Add Database",
    description: "Add a new database connection",
    icon: "Database",
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

  loadExcelCsv: {
    id: "loadExcelCsv",
    section: "datasources",
    label: "Load Excel/CSV",
    description: "Load data from an Excel or CSV file",
    icon: "FileJson",
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

  saveExcelCsv: {
    id: "saveExcelCsv",
    section: "datasources",
    label: "Save Excel/CSV",
    description: "Save data to an Excel or CSV file",
    icon: "FileJson",
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

  getApiRest: {
    id: "getApiRest",
    section: "datasources",
    label: "Get API (REST)",
    description: "Send a GET request to a REST API",
    icon: "Link",
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

  postApiRest: {
    id: "postApiRest",
    section: "datasources",
    label: "Post API (REST)",
    description: "Send a POST request to a REST API",
    icon: "Link",
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

  loadJsonFile: {
    id: "loadJsonFile",
    section: "datasources",
    label: "Load JSON File",
    description: "Load data from a JSON file",
    icon: "FileJson",
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

  saveJsonFile: {
    id: "saveJsonFile",
    section: "datasources",
    label: "Save JSON File",
    description: "Save data to a JSON file",
    icon: "FileJson",
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
};
