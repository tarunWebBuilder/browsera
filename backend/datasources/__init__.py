from .add_database import execute as add_database
from .add_mysql_db import execute as add_mysql_db
from .add_sql_server_db import execute as add_sql_server_db
from .dataframe_to_list import execute as dataframe_to_list
from .get_api import execute as get_api
from .list_to_dataframe import execute as list_to_dataframe
from .load_csv import execute as load_csv
from .load_excel import execute as load_excel
from .load_json_file import execute as load_json_file
from .load_txt_file import execute as load_txt_file
from .post_api import execute as post_api
from .save_csv import execute as save_csv
from .save_excel import execute as save_excel
from .save_json_file import execute as save_json_file
from .save_txt_file import execute as save_txt_file

DATASOURCE_ACTIONS = {
    "addDatabase": add_database,
    "addMySQLDB": add_mysql_db,
    "addSQLServerDB": add_sql_server_db,
    "dataframeToList": dataframe_to_list,
    "getAPI": get_api,
    "listToDataframe": list_to_dataframe,
    "loadCSV": load_csv,
    "loadExcel": load_excel,
    "loadJsonFile": load_json_file,
    "loadTxtFile": load_txt_file,
    "postAPI": post_api,
    "saveCSV": save_csv,
    "saveExcel": save_excel,
    "saveJsonFile": save_json_file,
    "saveTxtFile": save_txt_file,
}
