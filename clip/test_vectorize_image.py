#!/usr/bin/env python3
"""Utility script to POST a Base64 encoded image to the vectorize-image endpoint."""

import argparse
import base64
import json
from pathlib import Path
from urllib import request, error


def main() -> None:
    parser = argparse.ArgumentParser(description="Send image to /vectorize-image endpoint")
    parser.add_argument(
        "image",
        type=Path,
        nargs="?",
        default=Path("../dataset/images/1163.jpg"),
        help="Path to the image file (default: public/favicon-32x32.png)",
    )
    parser.add_argument(
        "--endpoint",
        default="http://127.0.0.1:8000/vectorize-image",
        help="Full URL of the vectorize-image endpoint",
    )

    args = parser.parse_args()

    if not args.image.is_file():
        raise SystemExit(f"Image file not found: {args.image}")

    image_bytes = args.image.read_bytes()
    image_base64 = base64.b64encode(image_bytes).decode("ascii")

    payload = json.dumps({"image_base64": image_base64}).encode("utf-8")
    req = request.Request(
        args.endpoint,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req) as resp:
            print(f"Status: {resp.status}")
            body = resp.read()
            if body:
                print(body.decode("utf-8"))
    except error.HTTPError as http_err:
        print(f"HTTP error: {http_err.code} {http_err.reason}")
        detail = http_err.read().decode("utf-8", errors="replace")
        if detail:
            print(detail)
    except error.URLError as url_err:
        print(f"Connection error: {url_err.reason}")


if __name__ == "__main__":
    main()
