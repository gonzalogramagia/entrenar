# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy all files from the root
COPY . .

# Move to the backend directory to build
WORKDIR /app/backend

# Download dependencies
RUN go mod download

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/main .

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Copy the binary from builder stage
COPY --from=builder /app/main /app/main

# Railway will pass the PORT env var. The app will bind to it automatically.
# We don't need to specify a port here, but just for reference:
EXPOSE 3210

# Command to run
CMD ["/app/main"]
