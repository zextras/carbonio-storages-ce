services {
  check {
    http = "localhost:5794/health/live",
    method = "GET",
    timeout = "1s"
    interval = "5s"
  }
  connect {
    sidecar_service { }
  }
  name = "storages-ce"
  port = 5794
}
