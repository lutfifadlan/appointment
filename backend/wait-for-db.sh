#!/bin/sh
# Simple script to wait for a host:port to be available

host="$1"
port="$2"
shift 2
max_tries=60
tries=0

echo "Waiting for $host:$port to be available..."
until nc -z "$host" "$port" > /dev/null 2>&1; do
  tries=$((tries+1))
  if [ $tries -ge $max_tries ]; then
    echo "Error: Timed out waiting for $host:$port"
    exit 1
  fi
  echo "Waiting for $host:$port... ($tries/$max_tries)"
  sleep 1
done

echo "$host:$port is available, executing: $@"
exec "$@"
