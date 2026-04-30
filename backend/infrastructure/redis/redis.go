package redisclient

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// Connect parses the Redis URL and returns a connected client.
// If connection fails, it logs a warning and returns nil (optional).
func Connect(url string) *redis.Client {
	if url == "" {
		return nil
	}

	opts, err := redis.ParseURL(url)
	if err != nil {
		fmt.Printf("redis: invalid url: %v (redis disabled)\n", err)
		return nil
	}

	client := redis.NewClient(opts)

	if err := client.Ping(context.Background()).Err(); err != nil {
		fmt.Printf("redis: ping failed: %v (redis disabled)\n", err)
		return nil
	}

	return client
}
