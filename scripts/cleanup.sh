#!/bin/bash

echo "Cleaning up unused Docker images..."
docker image prune -f || true
