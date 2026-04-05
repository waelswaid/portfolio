import logging
import json
from datetime import datetime, timezone

from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter


_tracer_provider: TracerProvider | None = None
_meter_provider: MeterProvider | None = None
_logger_provider: LoggerProvider | None = None


class _JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        span = trace.get_current_span()
        ctx = span.get_span_context() if span else None

        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "trace_id": format(ctx.trace_id, "032x") if ctx and ctx.trace_id else "",
            "span_id": format(ctx.span_id, "016x") if ctx and ctx.span_id else "",
        }

        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def init_observability(service_name: str, service_version: str = "0.1.0", engine=None) -> None:
    global _tracer_provider, _meter_provider, _logger_provider

    resource = Resource.create({
        "service.name": service_name,
        "service.version": service_version,
    })

    # traces
    _tracer_provider = TracerProvider(resource=resource)
    _tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(_tracer_provider)

    # metrics
    reader = PeriodicExportingMetricReader(OTLPMetricExporter(), export_interval_millis=15000)
    _meter_provider = MeterProvider(resource=resource, metric_readers=[reader])
    metrics.set_meter_provider(_meter_provider)

    # logs — send to collector via OTLP
    _logger_provider = LoggerProvider(resource=resource)
    _logger_provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter()))

    otel_handler = LoggingHandler(logger_provider=_logger_provider)
    logging.getLogger().addHandler(otel_handler)

    # structured JSON on stdout
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    for h in root.handlers:
        if isinstance(h, logging.StreamHandler) and not isinstance(h, LoggingHandler):
            h.setFormatter(_JSONFormatter())
            break
    else:
        console = logging.StreamHandler()
        console.setFormatter(_JSONFormatter())
        root.addHandler(console)

    # reduce uvicorn access log noise
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    # auto-instrument FastAPI
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    FastAPIInstrumentor().instrument()

    # auto-instrument SQLAlchemy if engine provided
    if engine is not None:
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
        SQLAlchemyInstrumentor().instrument(engine=engine.sync_engine)

    # optional: instrument botocore (upload service)
    try:
        from opentelemetry.instrumentation.botocore import BotocoreInstrumentor
        BotocoreInstrumentor().instrument()
    except ImportError:
        pass

    # optional: instrument redis (upload service)
    try:
        from opentelemetry.instrumentation.redis import RedisInstrumentor
        RedisInstrumentor().instrument()
    except ImportError:
        pass


def shutdown_observability() -> None:
    if _tracer_provider:
        _tracer_provider.force_flush()
        _tracer_provider.shutdown()
    if _meter_provider:
        _meter_provider.force_flush()
        _meter_provider.shutdown()
    if _logger_provider:
        _logger_provider.force_flush()
        _logger_provider.shutdown()
