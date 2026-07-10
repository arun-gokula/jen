terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

provider "docker" {}

# --- Network ---
resource "docker_network" "app_network" {
  name = "jen-network"
}

# --- Persistent volume for MySQL data ---
#resource "docker_volume" "db_data" {
#  name = "jen_tf_db_data"
#}

# --- Database: MySQL ---
resource "docker_image" "mysql" {
  name = "mysql:8.0"
}

resource "docker_container" "db" {
  name    = "userdb-container"
  image   = docker_image.mysql.image_id
  restart = "always"

  networks_advanced {
    name    = docker_network.app_network.name
    aliases = ["db"]
  }

  env = [
    "MYSQL_ROOT_PASSWORD=rootpass",
    "MYSQL_DATABASE=userdb"
  ]

  ports {
    internal = 3306
    external = 3306
  }

  volumes {
    host_path      = abspath("${path.module}/db/init.sql")
    container_path = "/docker-entrypoint-initdb.d/init.sql"
    read_only      = true
  }

  volumes {
    #volume_name    = docker_volume.db_data.name
    host_path      = abspath("${path.module}/mysql_data")
    container_path = "/var/lib/mysql"
  }

  healthcheck {
    test     = ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-prootpass"]
    interval = "5s"
    timeout  = "5s"
    retries  = 10
  }
}

# --- App: built directly via docker CLI, bypassing buggy provider builder ---
resource "null_resource" "build_app" {
  triggers = {
    dockerfile_hash = filesha256("${path.module}/app/Dockerfile")
  }

  provisioner "local-exec" {
    command = "docker build -t hello-app:latest ${path.module}/app"
  }
}

data "docker_image" "app" {
  name = "hello-app:latest"

  depends_on = [null_resource.build_app]
}

resource "docker_container" "app" {
  name    = "hello-app-container"
  image   = data.docker_image.app.id
  restart = "always"

  networks_advanced {
    name = docker_network.app_network.name
  }

  env = [
    "DB_HOST=db",
    "DB_USER=root",
    "DB_PASSWORD=rootpass",
    "DB_NAME=userdb"
  ]

  ports {
    internal = 3000
    external = 80
  }

  depends_on = [docker_container.db]
}