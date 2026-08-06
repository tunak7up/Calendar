#!/bin/bash
set -e

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

echo "Verifying running containers..."
docker compose -f "$COMPOSE_FILE" ps
