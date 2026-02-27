from .connect_milus import execute as connect_milus
from .connect_mongo import execute as connect_mongo

from .insert_milus import execute as insert_milus
from .insert_mongo import execute as insert_mongo

from .delete_milus import execute as delete_milus
from .delete_mongo import execute as delete_mongo
from .analyze_sites import execute as analyze_sites
from .fetch_text import execute as fetch_text


from .convert_pdf_to_markdown import execute as convert_pdf_to_markdown




INTEGRATION_ACTIONS = {
    "connectMongo": connect_mongo,
    "closeMilus": connect_milus,
    "insertMilus":insert_milus,
    "insertMongo":insert_mongo,
    "deleteMongo": delete_mongo,
    "deleteMilus": delete_milus,
"analyzeSites":analyze_sites,
"fetchText":fetch_text,
"pdfTomarkdown":convert_pdf_to_markdown
}