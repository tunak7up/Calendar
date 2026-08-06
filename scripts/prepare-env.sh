#!/bin/bash
set -e

echo "Loading environment files..."

if [ -n "$ROOT_ENV" ] && [ -f "$ROOT_ENV" ]; then
    cp "$ROOT_ENV" .env
    echo "Root .env file loaded."
fi

if [ -n "$BE_ENV_DOCKER" ] && [ -f "$BE_ENV_DOCKER" ]; then
    cp "$BE_ENV_DOCKER" be/.env.docker
    echo "be/.env.docker file loaded."
fi
