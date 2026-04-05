from opentelemetry import metrics

meter = metrics.get_meter("portfolio.custom")

# -- chat service --

ws_active_connections = meter.create_up_down_counter(
    "ws.active_connections",
    description="Number of active WebSocket connections",
)

ws_messages_total = meter.create_counter(
    "ws.messages_total",
    description="Total WebSocket messages processed",
)

kafka_messages_produced = meter.create_counter(
    "kafka.messages.produced",
    description="Total Kafka messages produced",
)

kafka_messages_consumed = meter.create_counter(
    "kafka.messages.consumed",
    description="Total Kafka messages consumed",
)

kafka_consumer_errors = meter.create_counter(
    "kafka.consumer.errors",
    description="Total Kafka consumer processing errors",
)

# -- upload service --

upload_requests_total = meter.create_counter(
    "upload.requests_total",
    description="Total upload requests",
)

upload_bytes_total = meter.create_counter(
    "upload.bytes_total",
    description="Total bytes uploaded",
)

rate_limit_hits = meter.create_counter(
    "upload.rate_limit_hits",
    description="Total rate limit rejections",
)
