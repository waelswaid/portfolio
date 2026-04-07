import contextlib
import logging
from opentelemetry import trace, context
from opentelemetry.propagate import get_global_textmap

logger = logging.getLogger(__name__)


class KafkaHeaderCarrier:
    """Adapts Kafka headers (list of (key, bytes) tuples) to the OTel propagator interface."""

    def __init__(self, headers=None):
        self._headers = list(headers) if headers else []

    def __setitem__(self, key, value):
        self._headers = [(k, v) for k, v in self._headers if k != key]
        self._headers.append((key, value.encode() if isinstance(value, str) else value))

    def __getitem__(self, key):
        for k, v in self._headers:
            if k == key:
                return v.decode() if isinstance(v, bytes) else v
        raise KeyError(key)

    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default

    def keys(self):
        return [k for k, _ in self._headers]

    @property
    def headers(self):
        return self._headers
    



def inject_trace_context() -> list[tuple[str, bytes]]:
    """Inject current trace context into Kafka headers for the producer side."""
    carrier = KafkaHeaderCarrier()
    get_global_textmap().inject(carrier=carrier)
    return carrier.headers


def extract_trace_context(headers) -> context.Context:
    """Extract trace context from Kafka message headers on the consumer side."""
    carrier = KafkaHeaderCarrier(headers or [])
    return get_global_textmap().extract(carrier=carrier)


@contextlib.asynccontextmanager
async def ws_span(name: str, attributes: dict | None = None):
    """Create a traced span for WebSocket operations (not auto-instrumented by OTel)."""
    tracer = trace.get_tracer(__name__)
    try:
        span = tracer.start_span(name, kind=trace.SpanKind.SERVER, attributes=attributes or {})
    except Exception:
        logger.warning("failed to create span %s", name, exc_info=True)
        yield None
        return

    ctx = trace.set_span_in_context(span)
    token = context.attach(ctx)
    try:
        yield span
    except Exception as exc:
        span.set_status(trace.StatusCode.ERROR, str(exc))
        span.record_exception(exc)
        raise
    finally:
        span.end()
        context.detach(token)
