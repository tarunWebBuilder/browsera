

from integrations import connect_milus, connect_mongo, delete_milus, delete_mongo, insert_milus, insert_mongo , analyze_sites, convert_pdf_to_markdown , fetch_text 
from cleaning import (
    drop_column,
    rename_column,
    select_columns,
    add_constant_column,
    replace_string,
    search_string,
    filter_string_data,
    split_string_data,
    sort_data,
    remove_duplicates,
    remove_empty_rows,
    knn_imputation,
    find_difference_in_data,
    detect_or_remove_outliers,
    column_wise_shift,
)

# DATASOURCES
from datasources import (
    add_database,
    add_mysql_db,
    add_sql_server_db,
    load_csv,
    load_excel,
    load_json_file,
    load_txt_file,
    save_csv,
    save_excel,
    save_json_file,
    save_txt_file,
    get_api,
    post_api,
    dataframe_to_list,
    list_to_dataframe,
)

# WEBSCRAPING
from webscraping import (
    open_browser,
    load_website,
    refresh_page_source,
    click,
    click_id_element,
    click_name_element,
    click_xpath_element,
    write,
    use_key,
    wait,
    scan_web_page,
    extract_xpath_element,
    extract_multiple_xpaths,
    get_current_url,
    close_browser,
    solve_and_paginate,
    solve_captcha,
    solve_os_captcha,
)

# CONTROL
from control import (
    add_new_variable,
    # convert_variable_type,
    # math_modify_variable,
    if_condition,
    # print_variable,
    # load_python_script,
)

ACTION_REGISTRY = {

    # ───────── CLEANING ─────────
    "dropColumn": drop_column,
    "renameColumn": rename_column,
    "selectColumns": select_columns,
    "addConstantColumn": add_constant_column,
    "replaceString": replace_string,
    "searchString": search_string,
    "filterString": filter_string_data,
    "splitString": split_string_data,
    "sortData": sort_data,
    "removeDuplicates": remove_duplicates,
    "removeEmptyRows": remove_empty_rows,
    "knnImputation": knn_imputation,
    "findDifference": find_difference_in_data,
    "outliers": detect_or_remove_outliers,
    "columnShift": column_wise_shift,

    # ───────── DATASOURCES ─────────
    "addDatabase": add_database,
    "addMysqlDb": add_mysql_db,
    "addSqlServerDb": add_sql_server_db,

    "loadCSV": load_csv,
    "loadExcel": load_excel,
    "loadJsonFile": load_json_file,
    "loadTxtFile": load_txt_file,

    "saveCSV": save_csv,
    "saveExcel": save_excel,
    "saveJsonFile": save_json_file,
    "saveTxtFile": save_txt_file,

    "getApiRest": get_api,
    "postApiRest": post_api,

    "dataframeToList": dataframe_to_list,
    "listToDataframe": list_to_dataframe,

    # ───────── WEBSCRAPING ─────────
    "openBrowser": open_browser,
    "loadWebsite": load_website,
    "refreshPageSource": refresh_page_source,

    "click": click,
    "clickId": click_id_element,
    "clickName": click_name_element,
    "clickXPath": click_xpath_element,

    "write": write,
    "useKey": use_key,
    "wait": wait,

    "scanWebPage": scan_web_page,

    "extractXPath": extract_xpath_element,
    "extractMultipleXPaths": extract_multiple_xpaths,

    "getCurrentUrl": get_current_url,
    "closeBrowser": close_browser,
    "solveAndPaginateHtml": solve_and_paginate,
    "solveCaptcha": solve_captcha,
    "solveOpenSourceCaptcha": solve_os_captcha,

    # ───────── CONTROL ─────────
    "addVariable": add_new_variable,
    # "convertVariable": convert_variable_type,
    # "mathModify": math_modify_variable,
    # "ifCondition": if_condition,
    # "printVariable": print_variable,
    # "loadPythonScript": load_python_script,
        # ───────── DATABASE : MONGO ─────────
    "connectMongo": connect_mongo,
    "insertMongo": insert_mongo,
    "deleteMongo": delete_mongo,

    # ───────── DATABASE : MILVUS ─────────
    "connectMilvus": connect_milus,
    "insertMilvus": insert_milus,
    "deleteMilvus": delete_milus,

"fetchText":fetch_text,
    "analyzeSite":analyze_sites,
    "pdfTomarkdown":convert_pdf_to_markdown
}



def execute_action(action_id: str, inputs: dict, config: dict = {}):
    if action_id not in ACTION_REGISTRY:
        raise ValueError(f"Unknown action: {action_id}")

    action_func = ACTION_REGISTRY[action_id]  # <-- function

    try:
        # Call the function directly
        result = action_func(inputs, config)
        return {
            "status": "success",
            "actionId": action_id,
            "result": result
        }
    except Exception as e:
        # logger.error(str(e))
        return {
            "status": "failed",
            "actionId": action_id,
            "error": str(e)
        }
