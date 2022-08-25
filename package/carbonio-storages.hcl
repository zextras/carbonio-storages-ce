services {
  check {
    http = "http://127.78.0.3:10000/health/live",
    method = "GET",
    timeout = "1s"
    interval = "5s"
  }
  connect {
    sidecar_service {
      proxy {
        config {
          local_request_timeout_ms = 0
        }
        local_service_address = "127.78.0.3"
      }
    }
  }
  name = "carbonio-storages"
  port = 10000
}
