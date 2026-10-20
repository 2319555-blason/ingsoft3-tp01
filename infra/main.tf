# TP8 — El entorno PREPROD, escrito como código.
# No toca QA ni PROD (esos se crearon a mano en el TP6 y siguen igual): esto crea uno NUEVO.

terraform {
  required_version = ">= 1.5"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0" # versión fijada
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1" # versión fijada
    }
  }
}

# Las claves NO están acá: los providers las leen de variables de entorno.
provider "neon" {}   # NEON_API_KEY
provider "render" {} # RENDER_API_KEY y RENDER_OWNER_ID

# ---------- La base de preprod (Neon) ----------

resource "neon_project" "preprod" {
  name                      = "hm-preprod"
  org_id                    = var.neon_org_id # la organización de Neon donde se crea (no es secreto)
  history_retention_seconds = 21600 # tope del plan gratuito (sin esto el apply falla)
}

resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod_owner"
}

resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod"
  owner_name = neon_role.preprod.name
}

# ---------- Los dos servicios de preprod (Render), con la imagen del TP7 ----------

locals {
  # La cadena de conexión se ARMA con lo que devolvió Neon: nadie la copia y pega.
  conn = "Host=${neon_project.preprod.database_host};Database=${neon_database.preprod.name};Username=${neon_role.preprod.name};Password=${neon_role.preprod.password};SSL Mode=Require"
}

resource "render_web_service" "api" {
  name   = "hm-api-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_api # sin la etiqueta
      tag       = var.image_tag      # la etiqueta va acá
    }
  }

  env_vars = {
    ConnectionStrings__Default = { value = local.conn }
    PORT                       = { value = "8080" }
  }
}

resource "render_web_service" "front" {
  name   = "hm-front-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_front
      tag       = var.image_tag
    }
  }

  env_vars = {
    BACKEND_URL  = { value = trimsuffix(render_web_service.api.url, "/") } # sale de Terraform, no de un copy-paste
    DNS_RESOLVER = { value = "8.8.8.8" }
    PORT         = { value = "80" }
  }
}
