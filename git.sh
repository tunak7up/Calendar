#!/bin/bash

git add .
git commit -m "${1:-auto commit $(date '+%Y-%m-%d %H:%M:%S')}"
git push origin main