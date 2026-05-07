# Graph Report - .  (2026-05-07)

## Corpus Check
- 100 files · ~223,049 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 389 nodes · 499 edges · 36 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `Handler` - 31 edges
2. `Success()` - 21 edges
3. `Internal()` - 14 edges
4. `main()` - 11 edges
5. `Error()` - 11 edges
6. `RegisterRoutes()` - 10 edges
7. `IndianConstitution` - 9 edges
8. `DescribeDSN()` - 7 edges
9. `postgresLegalRepository` - 7 edges
10. `New()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `RegisterRoutes()` --calls--> `NewLogger()`  [INFERRED]
  backend\internal\user\delivery\http\handler.go → backend\pkg\audit\audit.go
- `main()` --calls--> `Error()`  [INFERRED]
  backend\cmd\api\main.go → backend\pkg\response\response.go
- `main()` --calls--> `DescribeDSN()`  [INFERRED]
  backend\cmd\api\main.go → backend\infrastructure\postgres\postgres.go
- `main()` --calls--> `NormalizeDSN()`  [INFERRED]
  backend\cmd\api\main.go → backend\infrastructure\postgres\postgres.go
- `main()` --calls--> `Connect()`  [INFERRED]
  backend\cmd\api\main.go → backend\infrastructure\redis\redis.go

## Communities

### Community 0 - "Community 0"
Cohesion: 0.0
Nodes (15): isApiAbortError(), Button(), Card(), CategoryChips(), LegalCard(), Loader(), SearchBar(), getVariantStyle() (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.0
Nodes (15): AIResponse, Citation, createRequest, Draft, DraftTemplate, Handler, profileNameFromEmail(), randomAlpha() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.0
Nodes (22): Adaptive Icon, Complaints Onboarding Image, Crime Onboarding Image, Dark Mode Palette, Dark Mode Screen, Expo, Favicon, Feature-based Architecture (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.0
Nodes (25): Auth Module, Backend, Clean Architecture, Complaint Module, Indian Constitution, Civil Procedure Code, Code of Criminal Procedure, Docker (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.0
Nodes (24): ActDetailsScreen, ArticleDetailScreen, ExplorerScreen, HomeScreen, AuthScreen, OnboardingScreen, ProfileScreen, FormsHubScreen (+16 more)

### Community 5 - "Community 5"
Cohesion: 0.0
Nodes (10): NewLegalHandler(), RegisterRoutes(), Connect(), LegalRepository, NewPostgresLegalRepository(), normalizeActParams(), normalizeSectionParams(), postgresLegalRepository (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.0
Nodes (15): fileExists(), findProjectRoot(), loadEnv(), main(), Action, NewLogger(), Entry, Logger (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.0
Nodes (12): buildActDescription(), ensureIndex(), ensureMeiliIndexes(), indexAct(), ingestAct(), normalizeText(), processAct(), run() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.0
Nodes (14): Bookmark, Complaint, ComplaintStatus, DocumentType, LegalDocument, Role, User, ConnectionInfo (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.0
Nodes (7): buildPaginatedPayload(), clampInt(), getIntQuery(), LegalHandler, BadRequest(), NotFound(), Raw()

### Community 10 - "Community 10"
Cohesion: 0.0
Nodes (12): Authentication Middleware, Configuration Package, Legal HTTP Handler, Legal Repository, Legal Use Case, Logger Package, Main Application Entry Point, Meilisearch Infrastructure (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.0
Nodes (8): Config, getEnv(), Load(), parseDuration(), sanitizeAllowedOrigins(), fileExists(), findProjectRoot(), main()

### Community 12 - "Community 12"
Cohesion: 0.0
Nodes (1): IndianConstitution

### Community 13 - "Community 13"
Cohesion: 0.0
Nodes (5): fetchJWKS(), JWTAuth(), JWK, JWKS, SupabaseClaims

### Community 15 - "Community 15"
Cohesion: 0.0
Nodes (2): toImpactStyle(), triggerHaptic()

### Community 16 - "Community 16"
Cohesion: 0.0
Nodes (6): API Client Module, API Endpoints Module, Ask AI Screen, Complaints List Screen, File Complaint Screen, Draft Types Screen

### Community 17 - "Community 17"
Cohesion: 0.0
Nodes (4): Act, ActListParams, Section, SectionListParams

### Community 24 - "Community 24"
Cohesion: 0.0
Nodes (2): Constitution of India Data Class, Constitution Index Module

### Community 25 - "Community 25"
Cohesion: 0.0
Nodes (2): Main App Component, App Entry Point

### Community 26 - "Community 26"
Cohesion: 0.0
Nodes (2): Legal Card Component, Explorer Types

### Community 35 - "Community 35"
Cohesion: 0.0
Nodes (1): Domain Models

### Community 36 - "Community 36"
Cohesion: 0.0
Nodes (1): Legal Models

### Community 37 - "Community 37"
Cohesion: 0.0
Nodes (1): Apply Schema Script

### Community 38 - "Community 38"
Cohesion: 0.0
Nodes (1): Ingest Legal Data Script

### Community 39 - "Community 39"
Cohesion: 0.0
Nodes (1): List DB State Script

### Community 40 - "Community 40"
Cohesion: 0.0
Nodes (1): Test DB Go Script

### Community 41 - "Community 41"
Cohesion: 0.0
Nodes (1): Test DB JS Script

### Community 42 - "Community 42"
Cohesion: 0.0
Nodes (1): Test REST API Script

### Community 43 - "Community 43"
Cohesion: 0.0
Nodes (1): Babel Configuration

### Community 44 - "Community 44"
Cohesion: 0.0
Nodes (1): Environment Type Declarations

### Community 45 - "Community 45"
Cohesion: 0.0
Nodes (1): Cases List Screen

### Community 46 - "Community 46"
Cohesion: 0.0
Nodes (1): Category Chips Component

### Community 47 - "Community 47"
Cohesion: 0.0
Nodes (1): Clause Modal Component

### Community 48 - "Community 48"
Cohesion: 0.0
Nodes (1): Search Bar Component

### Community 49 - "Community 49"
Cohesion: 0.0
Nodes (1): Section Card Component

### Community 50 - "Community 50"
Cohesion: 0.0
Nodes (1): useComplaintStore

## Knowledge Gaps
- **23 isolated node(s):** `ConnectionInfo`, `Role`, `DocumentType`, `LegalDocument`, `ComplaintStatus` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (10 nodes): `IndianConstitution`, `.articlesList()`, `.articleSummary()`, `._cleanText()`, `.countArticles()`, `.getArticle()`, `.preamble()`, `.searchByTitle()`, `.searchKeyword()`, `COI.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (6 nodes): `AppNavigator.tsx`, `AppNavigator()`, `ExploreTabScreen()`, `HomeTabScreen()`, `toImpactStyle()`, `triggerHaptic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `Constitution of India Data Class`, `Constitution Index Module`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `Main App Component`, `App Entry Point`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `Legal Card Component`, `Explorer Types`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Domain Models`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `Legal Models`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `Apply Schema Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `Ingest Legal Data Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `List DB State Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `Test DB Go Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Test DB JS Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `Test REST API Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `Babel Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `Environment Type Declarations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `Cases List Screen`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Category Chips Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `Clause Modal Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `Search Bar Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `Section Card Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `useComplaintStore`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.