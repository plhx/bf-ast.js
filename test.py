import http.server


def main() -> None:
    server = http.server.ThreadingHTTPServer(
        server_address=("", 8000),
        RequestHandlerClass=http.server.SimpleHTTPRequestHandler,
    )
    server.serve_forever()


if __name__ == "__main__":
    main()
