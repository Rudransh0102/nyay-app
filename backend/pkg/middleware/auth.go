package middleware

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// SupabaseClaims maps the JWT payload that Supabase issues.
type SupabaseClaims struct {
	Sub          string                 `json:"sub"`
	Email        string                 `json:"email"`
	AppMetadata  map[string]interface{} `json:"app_metadata"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
	jwt.RegisteredClaims
}

func (c *SupabaseClaims) appRole() string {
	if c.AppMetadata != nil {
		if r, ok := c.AppMetadata["role"].(string); ok && r != "" {
			return r
		}
	}
	return "citizen"
}

// JWK represents a JSON Web Key from Supabase
type JWK struct {
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	Kid string `json:"kid"`
	X   string `json:"x"`
	Y   string `json:"y"`
	Crv string `json:"crv"`
}

type JWKS struct {
	Keys []JWK `json:"keys"`
}

var (
	ecKeys    = make(map[string]*ecdsa.PublicKey)
	keysMu    sync.RWMutex
	lastFetch time.Time
)

func fetchJWKS(url string) error {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var jwks JWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return err
	}

	keysMu.Lock()
	defer keysMu.Unlock()

	for _, key := range jwks.Keys {
		if key.Kty == "EC" && key.Crv == "P-256" {
			xBuf, _ := base64.RawURLEncoding.DecodeString(key.X)
			yBuf, _ := base64.RawURLEncoding.DecodeString(key.Y)
			pubKey := &ecdsa.PublicKey{
				Curve: elliptic.P256(),
				X:     new(big.Int).SetBytes(xBuf),
				Y:     new(big.Int).SetBytes(yBuf),
			}
			ecKeys[key.Kid] = pubKey
		}
	}
	lastFetch = time.Now()
	return nil
}

// JWTAuth validates a Supabase-issued Bearer token.
func JWTAuth(secret string, jwksURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing or invalid authorization header"})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.ParseWithClaims(tokenStr, &SupabaseClaims{}, func(t *jwt.Token) (interface{}, error) {
			if t.Method.Alg() == "ES256" {
				kid, _ := t.Header["kid"].(string)
				keysMu.RLock()
				pubKey, ok := ecKeys[kid]
				keysMu.RUnlock()

				if !ok || time.Since(lastFetch) > 1*time.Hour {
					if err := fetchJWKS(jwksURL); err == nil {
						keysMu.RLock()
						pubKey, ok = ecKeys[kid]
						keysMu.RUnlock()
					}
				}
				if !ok {
					return nil, fmt.Errorf("unknown kid: %s", kid)
				}
				return pubKey, nil
			}
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); ok {
				return []byte(secret), nil
			}
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(*SupabaseClaims)
		if !ok || claims.Sub == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid token claims"})
			return
		}

		c.Set("user_id", claims.Sub)
		c.Set("email",   claims.Email)
		c.Set("role",    claims.appRole())
		c.Next()
	}
}

// RequireRole enforces RBAC using the role stored in the JWT.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *gin.Context) {
		roleVal, _ := c.Get("role")
		role, ok := roleVal.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "role not found in token"})
			return
		}
		if _, ok := allowed[role]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "insufficient permissions (token)"})
			return
		}
		c.Next()
	}
}

// RequireDBRole enforces RBAC by querying the database.
func RequireDBRole(db *sql.DB, roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(c *gin.Context) {
		userID, ok := c.Get("user_id")
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "user not authenticated"})
			return
		}

		rows, err := db.QueryContext(c.Request.Context(), 
			`SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1`, userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": "failed to verify roles"})
			return
		}
		defer rows.Close()

		hasPermission := false
		for rows.Next() {
			var roleName string
			if err := rows.Scan(&roleName); err == nil {
				if _, ok := allowed[roleName]; ok {
					hasPermission = true
					break
				}
			}
		}

		if !hasPermission {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "insufficient permissions (database)"})
			return
		}
		c.Next()
	}
}
