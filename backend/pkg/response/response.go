package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Success sends a 200 OK with a data envelope.
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
	})
}

// Created sends a 201 Created with a data envelope.
func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    data,
	})
}

// Paginated sends a paginated list response.
func Paginated(c *gin.Context, data interface{}, total int64, page, limit int) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (int(total) + limit - 1) / limit,
		},
	})
}

// Raw writes a pre-encoded JSON payload with a 200 OK status.
func Raw(c *gin.Context, payload []byte) {
	c.Data(http.StatusOK, "application/json", payload)
}

// BadRequest sends a 400 with a message.
func BadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": message})
}

// Error sends a custom status code with a message.
func Error(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"success": false, "message": message})
}

// Unauthorized sends a 401.
func Unauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": message})
}

// Forbidden sends a 403.
func Forbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, gin.H{"success": false, "message": message})
}

// NotFound sends a 404.
func NotFound(c *gin.Context, message string) {
	c.JSON(http.StatusNotFound, gin.H{"success": false, "message": message})
}

// Internal sends a 500 — always with a generic public message.
func Internal(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "an internal error occurred"})
}

// ValidationErrors sends a 422 with field-level errors.
func ValidationErrors(c *gin.Context, errs map[string]string) {
	c.JSON(http.StatusUnprocessableEntity, gin.H{
		"success": false,
		"message": "validation failed",
		"errors":  errs,
	})
}
