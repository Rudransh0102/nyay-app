# ─── Builder Stage ─────────────────────────────────────────
FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o nyay-api ./cmd/api

# ─── Minimal Runtime ──────────────────────────────────────
FROM gcr.io/distroless/static-debian12

WORKDIR /

COPY --from=builder /app/nyay-api .

EXPOSE 8080

USER nonroot:nonroot

ENTRYPOINT ["/nyay-api"]