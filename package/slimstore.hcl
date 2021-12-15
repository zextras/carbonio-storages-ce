services {
  check {
    tcp = "localhost:5794",
    method = "GET",
    timeout = "1s"
    interval = "5s"
  }
  connect {
    sidecar_service { }
  }
  name = "slimstore"
  port = 5794
}
