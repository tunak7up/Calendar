#!/bin/bash
set -e

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

echo "Building and deploying application with Docker Compose (${COMPOSE_FILE})..."
docker compose -f "$COMPOSE_FILE" up --build -d
