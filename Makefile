test:
	deno test -A

fmt-check:
	deno fmt --check

fmt:
	deno fmt

lint:
	deno lint

.PHONY: test fmt lint
