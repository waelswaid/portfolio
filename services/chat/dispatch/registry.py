from typing import Callable, Awaitable

# type alias describes "any async function(Callable), that takes any arguments and returns None"
HandlerFn = Callable[..., Awaitable[None]]
#                    ^^^   ^^^^^^^^^^^^^^
#                     |     returns coroutine object that resolves to None
#                     |
#                     what it accepts (... = anything)


# module-level dict that maps string keys to handler functions
# {"message":message_handler_func}
_registry: dict[str, HandlerFn] = {}



"""
@handles("message")   # step 1: Python calls handles("message") → returns decorator
async def handle_message(ctx): # step 2: Python calls decorator(handle_message)
_registry["message"] = handle_message # step 3: register key:value
"""
def handles(msg_type: str):
    def decorator(fn: HandlerFn) -> HandlerFn:
        if msg_type in _registry:
            raise ValueError(f"duplicate handler for {msg_type!r}")
        _registry[msg_type] = fn 
        return fn
    return decorator


def get_handler(msg_type: str) -> HandlerFn | None:
    return _registry.get(msg_type)
