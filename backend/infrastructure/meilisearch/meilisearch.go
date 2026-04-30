package meilisearchclient

import (
	"github.com/meilisearch/meilisearch-go"
)

// Connect returns an initialised Meilisearch client.
func Connect(url, apiKey string) *meilisearch.Client {
	return meilisearch.NewClient(meilisearch.ClientConfig{
		Host:   url,
		APIKey: apiKey,
	})
}

// EnsureIndex creates the index if it doesn't exist with the given primary key.
func EnsureIndex(client *meilisearch.Client, indexUID, primaryKey string) error {
	_, err := client.GetIndex(indexUID)
	if err == nil {
		return nil // already exists
	}
	task, err := client.CreateIndex(&meilisearch.IndexConfig{
		Uid:        indexUID,
		PrimaryKey: primaryKey,
	})
	if err != nil {
		return err
	}
	_, err = client.WaitForTask(task.TaskUID)
	return err
}
