from .start import execute as start
from .finish import execute as finish
from .add_new_variable import execute as add_new_variable
from .if_condition import execute as if_condition

CONTROL_ACTIONS = {
    "start": start,
    "finish": finish,
    "addVariable": add_new_variable,
    "ifCondition": if_condition,
}
