# Nada de esto es secreto: nombre de una imagen pública, una etiqueta y una región.

variable "image_repo_api" {
  default = "ghcr.io/2319555-blason/ingsoft3-tp01-backend"
}

variable "image_repo_front" {
  default = "ghcr.io/2319555-blason/ingsoft3-tp01-frontend"
}

variable "image_tag" {
  # la imagen de la release v7.0.0
  default = "sha-0905f6e4864d5cd7443d4564ea01bad9ae7f5f73"
}

variable "region" {
  default = "virginia" # la misma región que QA y PROD
}

variable "neon_org_id" {
  # Organization settings de Neon -> Organization ID (empieza con org-). No es secreto.
  default = "org-blue-dust-84441596"
}
