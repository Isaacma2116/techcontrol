-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: techcontrol
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accesorios`
--

DROP TABLE IF EXISTS `accesorios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accesorios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codigo_inventario` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_accesorio_id` int unsigned NOT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_serie` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('disponible','asignado','mantenimiento','reparacion','baja','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'disponible',
  `fecha_compra` date DEFAULT NULL,
  `garantia_vence` date DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_baja` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_accesorios_codigo` (`codigo_inventario`),
  UNIQUE KEY `uq_accesorios_serie` (`numero_serie`),
  KEY `fk_accesorios_tipo` (`tipo_accesorio_id`),
  KEY `idx_accesorios_estado` (`estado`),
  KEY `idx_accesorios_marca` (`marca`),
  CONSTRAINT `fk_accesorios_tipo` FOREIGN KEY (`tipo_accesorio_id`) REFERENCES `tipos_accesorio` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accesorios`
--

LOCK TABLES `accesorios` WRITE;
/*!40000 ALTER TABLE `accesorios` DISABLE KEYS */;
INSERT INTO `accesorios` VALUES (1,'15',1,'mouse','hp','2200',NULL,'asignado','2026-09-20','2027-01-22','es nuevo',NULL,NULL,'2026-09-20 16:51:30','2026-09-20 16:51:39'),(3,'151122',3,'mouse','hp','2200','wwqqwwe','disponible','2026-09-26','2026-09-23',NULL,NULL,NULL,'2026-09-20 16:52:04','2026-09-20 16:52:04');
/*!40000 ALTER TABLE `accesorios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_areas_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areas`
--

LOCK TABLES `areas` WRITE;
/*!40000 ALTER TABLE `areas` DISABLE KEYS */;
INSERT INTO `areas` VALUES (1,'tics',1,'2026-09-20 14:25:25','2026-09-20 14:25:25');
/*!40000 ALTER TABLE `areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignaciones_accesorios`
--

DROP TABLE IF EXISTS `asignaciones_accesorios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones_accesorios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `accesorio_id` int unsigned NOT NULL,
  `colaborador_id` int unsigned NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_devolucion` datetime DEFAULT NULL,
  `estado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if((`fecha_devolucion` is null),_utf8mb4'activa',_utf8mb4'devuelta')) STORED,
  `asignado_por` int unsigned DEFAULT NULL,
  `recibido_por` int unsigned DEFAULT NULL,
  `observaciones_asignacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observaciones_devolucion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `condicion_devolucion` enum('bueno','regular','danado','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `accesorio_vigente_id` int unsigned GENERATED ALWAYS AS (if((`fecha_devolucion` is null),`accesorio_id`,NULL)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asig_accesorios_vigente` (`accesorio_vigente_id`),
  KEY `fk_asig_accesorios_asignado_por` (`asignado_por`),
  KEY `fk_asig_accesorios_recibido_por` (`recibido_por`),
  KEY `idx_asig_accesorios_colaborador` (`colaborador_id`,`fecha_devolucion`),
  KEY `idx_asig_accesorios_historial` (`accesorio_id`,`fecha_asignacion`),
  KEY `idx_asig_accesorios_estado` (`estado`),
  CONSTRAINT `fk_asig_accesorios_accesorio` FOREIGN KEY (`accesorio_id`) REFERENCES `accesorios` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asig_accesorios_asignado_por` FOREIGN KEY (`asignado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asig_accesorios_colaborador` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asig_accesorios_recibido_por` FOREIGN KEY (`recibido_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_asig_accesorios_fechas` CHECK (((`fecha_devolucion` is null) or (`fecha_devolucion` >= `fecha_asignacion`)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones_accesorios`
--

LOCK TABLES `asignaciones_accesorios` WRITE;
/*!40000 ALTER TABLE `asignaciones_accesorios` DISABLE KEYS */;
INSERT INTO `asignaciones_accesorios` (`id`, `accesorio_id`, `colaborador_id`, `fecha_asignacion`, `fecha_devolucion`, `asignado_por`, `recibido_por`, `observaciones_asignacion`, `observaciones_devolucion`, `condicion_devolucion`, `created_at`, `updated_at`) VALUES (1,1,1,'2026-09-20 16:51:39',NULL,1,NULL,NULL,NULL,NULL,'2026-09-20 16:51:39','2026-09-20 16:51:39');
/*!40000 ALTER TABLE `asignaciones_accesorios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignaciones_celulares`
--

DROP TABLE IF EXISTS `asignaciones_celulares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones_celulares` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `celular_id` int unsigned NOT NULL,
  `colaborador_id` int unsigned NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_devolucion` datetime DEFAULT NULL,
  `estado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if((`fecha_devolucion` is null),_utf8mb4'activa',_utf8mb4'devuelta')) STORED,
  `asignado_por` int unsigned DEFAULT NULL,
  `recibido_por` int unsigned DEFAULT NULL,
  `observaciones_asignacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observaciones_devolucion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `condicion_devolucion` enum('bueno','regular','danado','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `celular_vigente_id` int unsigned GENERATED ALWAYS AS (if((`fecha_devolucion` is null),`celular_id`,NULL)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asig_celulares_vigente` (`celular_vigente_id`),
  KEY `fk_asig_celulares_asignado_por` (`asignado_por`),
  KEY `fk_asig_celulares_recibido_por` (`recibido_por`),
  KEY `idx_asig_celulares_colaborador` (`colaborador_id`,`fecha_devolucion`),
  KEY `idx_asig_celulares_historial` (`celular_id`,`fecha_asignacion`),
  KEY `idx_asig_celulares_estado` (`estado`),
  CONSTRAINT `fk_asig_celulares_asignado_por` FOREIGN KEY (`asignado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asig_celulares_celular` FOREIGN KEY (`celular_id`) REFERENCES `celulares` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asig_celulares_colaborador` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asig_celulares_recibido_por` FOREIGN KEY (`recibido_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_asig_celulares_fechas` CHECK (((`fecha_devolucion` is null) or (`fecha_devolucion` >= `fecha_asignacion`)))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones_celulares`
--

LOCK TABLES `asignaciones_celulares` WRITE;
/*!40000 ALTER TABLE `asignaciones_celulares` DISABLE KEYS */;
INSERT INTO `asignaciones_celulares` (`id`, `celular_id`, `colaborador_id`, `fecha_asignacion`, `fecha_devolucion`, `asignado_por`, `recibido_por`, `observaciones_asignacion`, `observaciones_devolucion`, `condicion_devolucion`, `created_at`, `updated_at`) VALUES (5,11,1,'2026-09-21 10:28:00',NULL,1,NULL,NULL,NULL,NULL,'2026-09-21 10:28:00','2026-09-21 10:28:00');
/*!40000 ALTER TABLE `asignaciones_celulares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignaciones_equipos`
--

DROP TABLE IF EXISTS `asignaciones_equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones_equipos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `colaborador_id` int unsigned NOT NULL,
  `equipo_id` int unsigned NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_devolucion` datetime DEFAULT NULL,
  `estado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if((`fecha_devolucion` is null),_utf8mb4'activa',_utf8mb4'devuelta')) STORED,
  `asignado_por` int unsigned DEFAULT NULL,
  `recibido_por` int unsigned DEFAULT NULL,
  `observaciones_asignacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observaciones_devolucion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `condicion_devolucion` enum('bueno','regular','danado','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `equipo_vigente_id` int unsigned GENERATED ALWAYS AS (if((`fecha_devolucion` is null),`equipo_id`,NULL)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asignaciones_equipo_vigente` (`equipo_vigente_id`),
  KEY `fk_asignaciones_asignado_por` (`asignado_por`),
  KEY `fk_asignaciones_recibido_por` (`recibido_por`),
  KEY `idx_asignaciones_colaborador` (`colaborador_id`,`fecha_devolucion`),
  KEY `idx_asignaciones_equipo` (`equipo_id`),
  KEY `idx_asig_equipos_estado` (`estado`),
  KEY `idx_asig_equipos_historial` (`equipo_id`,`fecha_asignacion`),
  CONSTRAINT `fk_asignaciones_asignado_por` FOREIGN KEY (`asignado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asignaciones_colaborador` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asignaciones_equipo` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asignaciones_recibido_por` FOREIGN KEY (`recibido_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_asignaciones_fechas` CHECK (((`fecha_devolucion` is null) or (`fecha_devolucion` >= `fecha_asignacion`)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones_equipos`
--

LOCK TABLES `asignaciones_equipos` WRITE;
/*!40000 ALTER TABLE `asignaciones_equipos` DISABLE KEYS */;
INSERT INTO `asignaciones_equipos` (`id`, `colaborador_id`, `equipo_id`, `fecha_asignacion`, `fecha_devolucion`, `asignado_por`, `recibido_por`, `observaciones_asignacion`, `observaciones_devolucion`, `condicion_devolucion`, `created_at`, `updated_at`) VALUES (1,1,1,'2026-09-20 16:49:46','2026-09-20 16:50:05',1,1,NULL,'Cambio de responsable desde la edición del equipo.',NULL,'2026-09-20 16:49:46','2026-09-20 16:50:05'),(2,1,1,'2026-09-20 21:53:43',NULL,1,NULL,NULL,NULL,NULL,'2026-09-20 21:53:43','2026-09-20 21:53:43');
/*!40000 ALTER TABLE `asignaciones_equipos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignaciones_impresoras`
--

DROP TABLE IF EXISTS `asignaciones_impresoras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones_impresoras` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `impresora_id` int unsigned NOT NULL,
  `colaborador_id` int unsigned NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_devolucion` datetime DEFAULT NULL,
  `estado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if((`fecha_devolucion` is null),_utf8mb4'activa',_utf8mb4'devuelta')) STORED,
  `asignado_por` int unsigned DEFAULT NULL,
  `recibido_por` int unsigned DEFAULT NULL,
  `observaciones_asignacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observaciones_devolucion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `condicion_devolucion` enum('bueno','regular','danado','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `impresora_vigente_id` int unsigned GENERATED ALWAYS AS (if((`fecha_devolucion` is null),`impresora_id`,NULL)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asig_impresoras_vigente` (`impresora_vigente_id`),
  KEY `fk_asig_impresoras_asignado_por` (`asignado_por`),
  KEY `fk_asig_impresoras_recibido_por` (`recibido_por`),
  KEY `idx_asig_impresoras_colaborador` (`colaborador_id`,`fecha_devolucion`),
  KEY `idx_asig_impresoras_historial` (`impresora_id`,`fecha_asignacion`),
  KEY `idx_asig_impresoras_estado` (`estado`),
  CONSTRAINT `fk_asig_impresoras_asignado_por` FOREIGN KEY (`asignado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asig_impresoras_colaborador` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asig_impresoras_impresora` FOREIGN KEY (`impresora_id`) REFERENCES `impresoras` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asig_impresoras_recibido_por` FOREIGN KEY (`recibido_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_asig_impresoras_fechas` CHECK (((`fecha_devolucion` is null) or (`fecha_devolucion` >= `fecha_asignacion`)))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones_impresoras`
--

LOCK TABLES `asignaciones_impresoras` WRITE;
/*!40000 ALTER TABLE `asignaciones_impresoras` DISABLE KEYS */;
/*!40000 ALTER TABLE `asignaciones_impresoras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignaciones_licencias`
--

DROP TABLE IF EXISTS `asignaciones_licencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones_licencias` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `licencia_id` int unsigned NOT NULL,
  `colaborador_id` int unsigned DEFAULT NULL,
  `equipo_id` int unsigned DEFAULT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_liberacion` datetime DEFAULT NULL,
  `estado` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if((`fecha_liberacion` is null),_utf8mb4'activa',_utf8mb4'liberada')) STORED,
  `identificador_activacion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones_asignacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `observaciones_liberacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `asignado_por` int unsigned DEFAULT NULL,
  `liberado_por` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `vigente_colaborador` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if(((`fecha_liberacion` is null) and (`colaborador_id` is not null)),concat(`licencia_id`,_utf8mb4':C:',`colaborador_id`),NULL)) STORED,
  `vigente_equipo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if(((`fecha_liberacion` is null) and (`equipo_id` is not null)),concat(`licencia_id`,_utf8mb4':E:',`equipo_id`),NULL)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_asig_lic_colaborador` (`vigente_colaborador`),
  UNIQUE KEY `uq_asig_lic_equipo` (`vigente_equipo`),
  KEY `fk_asig_lic_asignado_por` (`asignado_por`),
  KEY `fk_asig_lic_liberado_por` (`liberado_por`),
  KEY `idx_asig_lic_licencia` (`licencia_id`,`fecha_liberacion`),
  KEY `idx_asig_lic_colaborador` (`colaborador_id`,`fecha_liberacion`),
  KEY `idx_asig_lic_equipo` (`equipo_id`,`fecha_liberacion`),
  CONSTRAINT `fk_asig_lic_asignado_por` FOREIGN KEY (`asignado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asig_lic_colaborador` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asig_lic_equipo` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asig_lic_liberado_por` FOREIGN KEY (`liberado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_asig_lic_licencia` FOREIGN KEY (`licencia_id`) REFERENCES `licencias` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_asig_lic_destino` CHECK (((`colaborador_id` is not null) or (`equipo_id` is not null)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones_licencias`
--

LOCK TABLES `asignaciones_licencias` WRITE;
/*!40000 ALTER TABLE `asignaciones_licencias` DISABLE KEYS */;
INSERT INTO `asignaciones_licencias` (`id`, `licencia_id`, `colaborador_id`, `equipo_id`, `fecha_asignacion`, `fecha_liberacion`, `identificador_activacion`, `observaciones_asignacion`, `observaciones_liberacion`, `asignado_por`, `liberado_por`, `created_at`, `updated_at`) VALUES (1,1,NULL,1,'2026-09-22 10:44:31',NULL,NULL,NULL,NULL,1,NULL,'2026-09-22 10:44:31','2026-09-22 10:44:31');
/*!40000 ALTER TABLE `asignaciones_licencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `action` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created_at` (`created_at`),
  KEY `idx_audit_entity` (`entity`,`entity_id`),
  KEY `idx_audit_user` (`user_id`,`created_at`),
  KEY `idx_audit_action` (`action`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'creada','carta_responsiva','1','::1','{\"folio\": \"CR-2026-000001\", \"recursos\": 1}','2026-09-20 22:30:22'),(2,1,'modificada','carta_responsiva','1','::1','{\"recursos\": 2}','2026-09-20 22:31:28'),(3,1,'modificada','carta_responsiva','1','::1','{\"recursos\": 2}','2026-09-21 10:15:48'),(4,1,'pdf_generado','carta_responsiva','1','::1','{\"folio\": \"CR-2026-000001\"}','2026-09-21 10:15:50'),(5,1,'firmada_subida','carta_responsiva','1','::1','{\"tamano\": 33896, \"version\": 1, \"archivo_original\": \"CR-2026-000001 (2).pdf\"}','2026-09-21 10:19:35'),(6,1,'logo_actualizado','empresa','1','::1',NULL,'2026-09-21 10:23:34'),(7,1,'actualizada','empresa','1','::1',NULL,'2026-09-21 10:23:38'),(8,1,'pdf_descargado','carta_responsiva','1','::1',NULL,'2026-09-21 10:23:55'),(9,1,'creada','carta_responsiva','2','::1','{\"folio\": \"CR-2026-000002\", \"recursos\": 1}','2026-09-21 10:28:39'),(10,1,'pdf_generado','carta_responsiva','2','::1','{\"folio\": \"CR-2026-000002\"}','2026-09-21 10:28:40'),(11,1,'creado','software','1','::1','{\"nombre\": \"office\"}','2026-09-22 10:41:25'),(12,1,'creada','licencia','1','::1','{\"codigo\": \"LIC-00001\", \"software\": \"office\", \"cantidad_total\": 5}','2026-09-22 10:42:26'),(13,1,'asignada','licencia','1','::1','{\"codigo\": \"LIC-00001\", \"equipo_id\": 1, \"colaborador_id\": null}','2026-09-22 10:44:31'),(14,1,'agendado','mantenimiento','1','::1','{\"tipo\": \"preventivo\", \"fecha\": \"2026-09-22\", \"folio\": \"MNT-2026-000001\", \"unidad\": \"15\"}','2026-09-22 10:46:16'),(15,1,'foto_actualizada','usuario','1','::1',NULL,'2026-09-22 22:41:53'),(16,1,'exportado','datos',NULL,'::1','{\"hojas\": [\"Equipos\", \"Accesorios\", \"Impresoras\", \"Celulares\", \"Colaboradores\", \"Licencias\"]}','2026-09-23 10:23:15'),(17,1,'editado','equipo','1','::1','{\"codigo_inventario\": \"15\"}','2026-09-23 10:42:40'),(18,1,'editado','equipo','1','::1','{\"codigo_inventario\": \"15\"}','2026-09-24 14:46:08'),(19,1,'password_consultada','equipo','1','::1','{\"codigo_inventario\": \"15\"}','2026-09-24 14:46:16'),(20,1,'password_consultada','equipo','1','::1','{\"codigo_inventario\": \"15\"}','2026-09-24 14:46:16');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cargos`
--

DROP TABLE IF EXISTS `cargos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cargos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cargos_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargos`
--

LOCK TABLES `cargos` WRITE;
/*!40000 ALTER TABLE `cargos` DISABLE KEYS */;
INSERT INTO `cargos` VALUES (1,'gerente',1,'2026-09-20 14:25:26','2026-09-20 14:25:26');
/*!40000 ALTER TABLE `cargos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cartas_responsivas`
--

DROP TABLE IF EXISTS `cartas_responsivas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cartas_responsivas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `folio` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `anio` smallint unsigned NOT NULL,
  `consecutivo` int unsigned NOT NULL,
  `colaborador_id` int unsigned NOT NULL,
  `plantilla` enum('equipo','celular','impresora','accesorio','general') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('borrador','generada','pendiente_firma','firmada','cancelada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'borrador',
  `fecha_entrega` date NOT NULL,
  `fecha_devolucion_esperada` date DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `condiciones_especiales` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `entrega_nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entrega_cargo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `colaborador_snapshot` json DEFAULT NULL,
  `empresa_snapshot` json DEFAULT NULL,
  `fecha_firma` date DEFAULT NULL,
  `generada_en` datetime DEFAULT NULL,
  `generada_por` int unsigned DEFAULT NULL,
  `cancelada_en` datetime DEFAULT NULL,
  `cancelada_por` int unsigned DEFAULT NULL,
  `motivo_cancelacion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_por` int unsigned DEFAULT NULL,
  `actualizado_por` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cartas_folio` (`folio`),
  UNIQUE KEY `uq_cartas_anio_consecutivo` (`anio`,`consecutivo`),
  KEY `fk_cartas_creado_por` (`creado_por`),
  KEY `fk_cartas_actualizado_por` (`actualizado_por`),
  KEY `fk_cartas_generada_por` (`generada_por`),
  KEY `fk_cartas_cancelada_por` (`cancelada_por`),
  KEY `idx_cartas_estado` (`estado`),
  KEY `idx_cartas_colaborador` (`colaborador_id`),
  KEY `idx_cartas_fecha_entrega` (`fecha_entrega`),
  CONSTRAINT `fk_cartas_actualizado_por` FOREIGN KEY (`actualizado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cartas_cancelada_por` FOREIGN KEY (`cancelada_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cartas_colaborador` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cartas_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cartas_generada_por` FOREIGN KEY (`generada_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_cartas_fechas` CHECK (((`fecha_devolucion_esperada` is null) or (`fecha_devolucion_esperada` >= `fecha_entrega`)))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cartas_responsivas`
--

LOCK TABLES `cartas_responsivas` WRITE;
/*!40000 ALTER TABLE `cartas_responsivas` DISABLE KEYS */;
INSERT INTO `cartas_responsivas` VALUES (1,'CR-2026-000001',2026,1,1,'general','firmada','2026-09-20',NULL,'hhshbsbbsb','jjoeopoejjhds  shs','jose','encargado','{\"id\": 1, \"area\": \"tics\", \"cargo\": \"gerente\", \"id_empleado\": \"01\", \"nombre_completo\": \"jose isaac macias delgado\", \"correo_empresarial\": \"macias@gmail.com\", \"telefono_empresarial\": \"4496334799\"}','{\"rfc\": null, \"correo\": null, \"nombre\": \"Mi empresa\", \"telefono\": null, \"direccion\": null, \"sitio_web\": null, \"pie_documento\": null, \"texto_condiciones\": \"Utilizar el recurso únicamente para fines laborales y conforme a las políticas de la empresa.\\nNo prestar, transferir, modificar ni reparar el recurso, ni instalar software no autorizado, sin la aprobación del área de TI.\\nMantener el recurso en buen estado y protegerlo contra pérdida, robo, daño o uso indebido.\\nReportar de inmediato al área de TI cualquier falla, daño, pérdida o robo.\\nProteger la información de la empresa contenida en el recurso y mantener la confidencialidad de las credenciales de acceso.\\nEn caso de pérdida, robo o daño por negligencia o mal uso, asumir la responsabilidad que corresponda conforme a las políticas de la empresa y a la legislación aplicable.\\nDevolver el recurso en las mismas condiciones en que fue entregado, salvo el desgaste normal por su uso.\", \"texto_declaracion\": \"Por medio de la presente, yo, {colaborador}, reconozco haber recibido de {empresa} el recurso o los recursos tecnológicos descritos en este documento, en buen estado de funcionamiento, para mi uso exclusivo en el desempeño de mis actividades laborales. Me hago responsable de su custodia, uso adecuado y conservación, y me comprometo a devolverlos cuando la empresa lo requiera o al concluir mi relación laboral.\"}','2026-09-20','2026-09-21 10:15:50',1,NULL,NULL,NULL,1,1,'2026-09-20 22:30:22','2026-09-21 10:19:35'),(2,'CR-2026-000002',2026,2,1,'celular','generada','2026-09-21','2026-10-10','lñhgfhdgfhjkl','ljguguggvvjggfyfyufyu','jose','encargado','{\"id\": 1, \"area\": \"tics\", \"cargo\": \"gerente\", \"id_empleado\": \"01\", \"nombre_completo\": \"jose isaac macias delgado\", \"correo_empresarial\": \"macias@gmail.com\", \"telefono_empresarial\": \"4496334799\"}','{\"rfc\": null, \"correo\": null, \"nombre\": \"PRUEBA\", \"telefono\": null, \"direccion\": null, \"sitio_web\": null, \"pie_documento\": null, \"texto_condiciones\": \"Utilizar el recurso únicamente para fines laborales y conforme a las políticas de la empresa.\\nNo prestar, transferir, modificar ni reparar el recurso, ni instalar software no autorizado, sin la aprobación del área de TI.\\nMantener el recurso en buen estado y protegerlo contra pérdida, robo, daño o uso indebido.\\nReportar de inmediato al área de TI cualquier falla, daño, pérdida o robo.\\nProteger la información de la empresa contenida en el recurso y mantener la confidencialidad de las credenciales de acceso.\\nEn caso de pérdida, robo o daño por negligencia o mal uso, asumir la responsabilidad que corresponda conforme a las políticas de la empresa y a la legislación aplicable.\\nDevolver el recurso en las mismas condiciones en que fue entregado, salvo el desgaste normal por su uso.\", \"texto_declaracion\": \"Por medio de la presente, yo, {colaborador}, reconozco haber recibido de {empresa} el recurso o los recursos tecnológicos descritos en este documento, en buen estado de funcionamiento, para mi uso exclusivo en el desempeño de mis actividades laborales. Me hago responsable de su custodia, uso adecuado y conservación, y me comprometo a devolverlos cuando la empresa lo requiera o al concluir mi relación laboral.\"}',NULL,'2026-09-21 10:28:40',1,NULL,NULL,NULL,1,1,'2026-09-21 10:28:39','2026-09-21 10:28:40');
/*!40000 ALTER TABLE `cartas_responsivas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cartas_responsivas_documentos`
--

DROP TABLE IF EXISTS `cartas_responsivas_documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cartas_responsivas_documentos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `carta_id` int unsigned NOT NULL,
  `tipo` enum('generado','firmado','firma_colaborador','firma_entrega') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` int unsigned NOT NULL DEFAULT '1',
  `vigente` tinyint(1) NOT NULL DEFAULT '1',
  `archivo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_original` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tamano` int unsigned NOT NULL,
  `sha256` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subido_por` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `vigente_clave` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if((`vigente` = 1),concat(`carta_id`,_utf8mb4':',`tipo`),NULL)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cartas_docs_version` (`carta_id`,`tipo`,`version`),
  UNIQUE KEY `uq_cartas_docs_archivo` (`archivo`),
  UNIQUE KEY `uq_cartas_docs_vigente` (`vigente_clave`),
  KEY `fk_cartas_docs_subido_por` (`subido_por`),
  CONSTRAINT `fk_cartas_docs_carta` FOREIGN KEY (`carta_id`) REFERENCES `cartas_responsivas` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cartas_docs_subido_por` FOREIGN KEY (`subido_por`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cartas_responsivas_documentos`
--

LOCK TABLES `cartas_responsivas_documentos` WRITE;
/*!40000 ALTER TABLE `cartas_responsivas_documentos` DISABLE KEYS */;
INSERT INTO `cartas_responsivas_documentos` (`id`, `carta_id`, `tipo`, `version`, `vigente`, `archivo`, `nombre_original`, `mime`, `tamano`, `sha256`, `subido_por`, `created_at`) VALUES (1,1,'generado',1,1,'b006c7b7-1010-4ede-9ddd-bce51360d036.pdf','CR-2026-000001.pdf','application/pdf',30635,'45e786d65fc95e83026fad000569565f4fdffdea6cb98f52368c5ea2a6fc3a63',1,'2026-09-21 10:15:50'),(2,1,'firmado',1,1,'95e56e3c-d0c3-441f-aae3-83e913595c87.pdf','CR-2026-000001 (2).pdf','application/pdf',33896,'1bdd8724c9ed32eba0ed34d0003709a709bd5fbcf0bceab8559ff7f3dd1fdf9a',1,'2026-09-21 10:19:35'),(3,2,'generado',1,1,'1eef7495-06ae-49c8-9d25-11d79c43274d.pdf','CR-2026-000002.pdf','application/pdf',794472,'76ea0e1609b05e8e412b143c086014ead2487cef8b1d42256aa4d81883b0117a',1,'2026-09-21 10:28:40');
/*!40000 ALTER TABLE `cartas_responsivas_documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cartas_responsivas_items`
--

DROP TABLE IF EXISTS `cartas_responsivas_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cartas_responsivas_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `carta_id` int unsigned NOT NULL,
  `tipo_recurso` enum('EQUIPO','ACCESORIO','IMPRESORA','CELULAR') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `asignacion_equipo_id` int unsigned DEFAULT NULL,
  `asignacion_accesorio_id` int unsigned DEFAULT NULL,
  `asignacion_impresora_id` int unsigned DEFAULT NULL,
  `asignacion_celular_id` int unsigned DEFAULT NULL,
  `snapshot` json DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `orden` smallint unsigned NOT NULL DEFAULT '0',
  `asignacion_clave` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (if((`activo` = 1),concat(`tipo_recurso`,_utf8mb4':',coalesce(`asignacion_equipo_id`,`asignacion_accesorio_id`,`asignacion_impresora_id`,`asignacion_celular_id`)),NULL)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cartas_items_asignacion` (`asignacion_clave`),
  KEY `fk_cartas_items_asig_equipo` (`asignacion_equipo_id`),
  KEY `fk_cartas_items_asig_acc` (`asignacion_accesorio_id`),
  KEY `fk_cartas_items_asig_imp` (`asignacion_impresora_id`),
  KEY `fk_cartas_items_asig_cel` (`asignacion_celular_id`),
  KEY `idx_cartas_items_carta` (`carta_id`),
  CONSTRAINT `fk_cartas_items_asig_acc` FOREIGN KEY (`asignacion_accesorio_id`) REFERENCES `asignaciones_accesorios` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cartas_items_asig_cel` FOREIGN KEY (`asignacion_celular_id`) REFERENCES `asignaciones_celulares` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cartas_items_asig_equipo` FOREIGN KEY (`asignacion_equipo_id`) REFERENCES `asignaciones_equipos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cartas_items_asig_imp` FOREIGN KEY (`asignacion_impresora_id`) REFERENCES `asignaciones_impresoras` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_cartas_items_carta` FOREIGN KEY (`carta_id`) REFERENCES `cartas_responsivas` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_cartas_items_una_asignacion` CHECK ((((((`asignacion_equipo_id` is not null) + (`asignacion_accesorio_id` is not null)) + (`asignacion_impresora_id` is not null)) + (`asignacion_celular_id` is not null)) = 1))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cartas_responsivas_items`
--

LOCK TABLES `cartas_responsivas_items` WRITE;
/*!40000 ALTER TABLE `cartas_responsivas_items` DISABLE KEYS */;
INSERT INTO `cartas_responsivas_items` (`id`, `carta_id`, `tipo_recurso`, `asignacion_equipo_id`, `asignacion_accesorio_id`, `asignacion_impresora_id`, `asignacion_celular_id`, `snapshot`, `activo`, `orden`) VALUES (4,1,'EQUIPO',2,NULL,NULL,NULL,'{\"id\": 1, \"ram\": \"15\", \"tipo\": \"Laptop\", \"marca\": \"hp\", \"estado\": \"asignado\", \"modelo\": \"2200\", \"titulo\": \"hp 2200\", \"tipo_id\": 1, \"hostname\": \"gifyudfhddfd\", \"disco_duro\": \"512\", \"fecha_baja\": null, \"procesador\": \"intel\", \"mac_address\": \"C8:94:02:40:AA:FD\", \"fecha_compra\": \"2026-09-01\", \"numero_serie\": \"012258444\", \"estado_fisico\": \"excelente\", \"observaciones\": \"kgffffddfdcvbcxfdfdfd\", \"tarjeta_madre\": \"n/a\", \"garantia_vence\": \"2026-09-25\", \"tarjeta_grafica\": \"amd ryzen\", \"garantia_detalle\": \"n/a\", \"codigo_inventario\": \"15\", \"sistema_operativo\": \"windows\", \"componentes_adicionales\": null}',1,0),(5,1,'ACCESORIO',NULL,1,NULL,NULL,'{\"id\": 1, \"tipo\": \"Mouse\", \"marca\": \"hp\", \"estado\": \"asignado\", \"modelo\": \"2200\", \"nombre\": \"mouse\", \"titulo\": \"mouse\", \"tipo_id\": 1, \"fecha_baja\": null, \"fecha_compra\": \"2026-09-20\", \"numero_serie\": null, \"observaciones\": \"es nuevo\", \"garantia_vence\": \"2027-01-22\", \"codigo_inventario\": \"15\"}',1,1),(6,2,'CELULAR',NULL,NULL,NULL,5,'{\"id\": 11, \"ram\": \"36\", \"tipo\": \"Celular\", \"color\": \"ROJO\", \"marca\": \"MOTOROLA\", \"estado\": \"asignado\", \"imei_1\": null, \"imei_2\": null, \"modelo\": \"G15\", \"titulo\": \"MOTOROLA G15\", \"tipo_id\": null, \"operador\": \"TELCEL\", \"fecha_baja\": null, \"fecha_compra\": \"2026-09-16\", \"numero_serie\": \"132659662984\", \"observaciones\": \"n/a\", \"almacenamiento\": \"265\", \"garantia_vence\": \"2026-09-21\", \"correo_asociado\": \"macias.jose.hv@gmail.com\", \"numero_telefono\": \"49655333226\", \"fecha_renovacion\": \"2026-09-15\", \"garantia_detalle\": \"n/a\", \"codigo_inventario\": \"15\", \"sistema_operativo\": \"windows\", \"componentes_adicionales\": [\"FUNDA Y CARGADOR\"]}',1,0);
/*!40000 ALTER TABLE `cartas_responsivas_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_software`
--

DROP TABLE IF EXISTS `categorias_software`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_software` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categorias_software_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_software`
--

LOCK TABLES `categorias_software` WRITE;
/*!40000 ALTER TABLE `categorias_software` DISABLE KEYS */;
INSERT INTO `categorias_software` VALUES (6,'Comunicación y colaboración'),(4,'Desarrollo'),(2,'Diseño gráfico'),(3,'Ingeniería y CAD'),(1,'Ofimática'),(9,'Otro'),(5,'Seguridad'),(7,'Sistema operativo'),(8,'Utilerías');
/*!40000 ALTER TABLE `categorias_software` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `celulares`
--

DROP TABLE IF EXISTS `celulares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `celulares` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codigo_inventario` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_serie` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imei_1` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imei_2` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sistema_operativo` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `almacenamiento` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ram` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_telefono` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operador` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo_asociado` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `componentes_adicionales` json DEFAULT NULL,
  `estado` enum('disponible','asignado','mantenimiento','reparacion','baja','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'disponible',
  `fecha_compra` date DEFAULT NULL,
  `fecha_renovacion` date DEFAULT NULL,
  `garantia_vence` date DEFAULT NULL,
  `garantia_detalle` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_baja` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_celulares_codigo` (`codigo_inventario`),
  UNIQUE KEY `uq_celulares_serie` (`numero_serie`),
  UNIQUE KEY `uq_celulares_imei_1` (`imei_1`),
  UNIQUE KEY `uq_celulares_imei_2` (`imei_2`),
  KEY `idx_celulares_estado` (`estado`),
  KEY `idx_celulares_marca` (`marca`),
  KEY `idx_celulares_telefono` (`numero_telefono`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `celulares`
--

LOCK TABLES `celulares` WRITE;
/*!40000 ALTER TABLE `celulares` DISABLE KEYS */;
INSERT INTO `celulares` VALUES (11,'15','MOTOROLA','G15','132659662984',NULL,NULL,'ROJO','windows','265','36','49655333226','TELCEL','macias.jose.hv@gmail.com','[\"FUNDA Y CARGADOR\"]','asignado','2026-09-16','2026-09-15','2026-09-21','n/a','565d1087-fc6e-485e-9be8-f7126114cb3d.jpg','n/a',NULL,'2026-09-21 10:28:00','2026-09-21 10:28:00');
/*!40000 ALTER TABLE `celulares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colaboradores`
--

DROP TABLE IF EXISTS `colaboradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colaboradores` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `id_empleado` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_paterno` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_materno` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area_id` int unsigned NOT NULL,
  `cargo_id` int unsigned NOT NULL,
  `correo_empresarial` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_empresarial` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo_personal` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_personal` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fotografia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_alta` date NOT NULL,
  `fecha_baja` date DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_colaboradores_id_empleado` (`id_empleado`),
  UNIQUE KEY `uq_colaboradores_correo_empresarial` (`correo_empresarial`),
  KEY `idx_colaboradores_area` (`area_id`),
  KEY `idx_colaboradores_cargo` (`cargo_id`),
  KEY `idx_colaboradores_activo` (`activo`),
  KEY `idx_colaboradores_nombre` (`apellido_paterno`,`nombre`),
  CONSTRAINT `fk_colaboradores_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_colaboradores_cargo` FOREIGN KEY (`cargo_id`) REFERENCES `cargos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colaboradores`
--

LOCK TABLES `colaboradores` WRITE;
/*!40000 ALTER TABLE `colaboradores` DISABLE KEYS */;
INSERT INTO `colaboradores` VALUES (1,'01','jose isaac','macias','delgado',1,1,'macias@gmail.com','4496334799','1@gmail.com','4496334798','c9046fbd-f7e7-448a-aa48-cfa9fa348d4e.png','2026-09-26',NULL,1,'2026-09-20 14:25:27','2026-09-20 14:25:27');
/*!40000 ALTER TABLE `colaboradores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_empresa`
--

DROP TABLE IF EXISTS `configuracion_empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_empresa` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Mi empresa',
  `rfc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sitio_web` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pie_documento` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entrega_nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entrega_cargo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `folio_prefijo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CR',
  `texto_declaracion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `texto_condiciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `updated_by` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formato_fecha` enum('larga','corta') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'larga',
  `encabezado_documento` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requiere_reautenticacion_sensible` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_configuracion_empresa_user` (`updated_by`),
  CONSTRAINT `fk_configuracion_empresa_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_configuracion_empresa_unica` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_empresa`
--

LOCK TABLES `configuracion_empresa` WRITE;
/*!40000 ALTER TABLE `configuracion_empresa` DISABLE KEYS */;
INSERT INTO `configuracion_empresa` VALUES (1,'PRUEBA',NULL,NULL,NULL,NULL,NULL,'9a6d7af1-8288-4b0e-bf29-67989dc1a24b.png',NULL,NULL,NULL,'CR',NULL,NULL,1,'2026-09-20 22:08:50','2026-09-21 10:23:38',NULL,'larga',NULL,0);
/*!40000 ALTER TABLE `configuracion_empresa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispositivos_red`
--

DROP TABLE IF EXISTS `dispositivos_red`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispositivos_red` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('router','switch','access_point','firewall','repetidor','antena','modem','controlador_wifi','servidor_red','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_serie` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mac_address` varchar(17) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_publica` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ubicacion_id` int unsigned DEFAULT NULL,
  `rack` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `puerto` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vlan_admin_id` int unsigned DEFAULT NULL,
  `estado` enum('activo','inactivo','mantenimiento','baja') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `responsable_id` int unsigned DEFAULT NULL,
  `fecha_instalacion` date DEFAULT NULL,
  `fecha_garantia` date DEFAULT NULL,
  `proveedor_id` int unsigned DEFAULT NULL,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `creado_por` int unsigned DEFAULT NULL,
  `actualizado_por` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dispred_codigo` (`codigo`),
  UNIQUE KEY `uq_dispred_serie` (`numero_serie`),
  UNIQUE KEY `uq_dispred_mac` (`mac_address`),
  KEY `fk_dispred_vlan_admin` (`vlan_admin_id`),
  KEY `fk_dispred_responsable` (`responsable_id`),
  KEY `fk_dispred_proveedor` (`proveedor_id`),
  KEY `fk_dispred_creado_por` (`creado_por`),
  KEY `fk_dispred_actualizado` (`actualizado_por`),
  KEY `idx_dispred_tipo` (`tipo`),
  KEY `idx_dispred_estado` (`estado`),
  KEY `idx_dispred_ubicacion` (`ubicacion_id`),
  KEY `idx_dispred_mac` (`mac_address`),
  CONSTRAINT `fk_dispred_actualizado` FOREIGN KEY (`actualizado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dispred_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dispred_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dispred_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dispred_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dispred_vlan_admin` FOREIGN KEY (`vlan_admin_id`) REFERENCES `redes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispositivos_red`
--

LOCK TABLES `dispositivos_red` WRITE;
/*!40000 ALTER TABLE `dispositivos_red` DISABLE KEYS */;
/*!40000 ALTER TABLE `dispositivos_red` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispositivos_red_redes`
--

DROP TABLE IF EXISTS `dispositivos_red_redes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispositivos_red_redes` (
  `dispositivo_id` int unsigned NOT NULL,
  `red_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `creado_por` int unsigned DEFAULT NULL,
  PRIMARY KEY (`dispositivo_id`,`red_id`),
  KEY `fk_dispredredes_creado_por` (`creado_por`),
  KEY `idx_dispredredes_red` (`red_id`,`dispositivo_id`),
  CONSTRAINT `fk_dispredredes_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dispredredes_dispositivo` FOREIGN KEY (`dispositivo_id`) REFERENCES `dispositivos_red` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dispredredes_red` FOREIGN KEY (`red_id`) REFERENCES `redes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispositivos_red_redes`
--

LOCK TABLES `dispositivos_red_redes` WRITE;
/*!40000 ALTER TABLE `dispositivos_red_redes` DISABLE KEYS */;
/*!40000 ALTER TABLE `dispositivos_red_redes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipos`
--

DROP TABLE IF EXISTS `equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tipo_equipo_id` int unsigned NOT NULL,
  `marca` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_inventario` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero_serie` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `procesador` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ram` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disco_duro` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tarjeta_madre` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tarjeta_grafica` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sistema_operativo` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mac_address` varchar(17) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hostname` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `componentes_adicionales` json DEFAULT NULL,
  `estado` enum('disponible','asignado','mantenimiento','reparacion','baja','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'disponible',
  `estado_fisico` enum('excelente','bueno','regular','malo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `fecha_compra` date DEFAULT NULL,
  `garantia_vence` date DEFAULT NULL,
  `garantia_detalle` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_baja` date DEFAULT NULL,
  `password_cifrado` varbinary(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_equipos_codigo` (`codigo_inventario`),
  UNIQUE KEY `uq_equipos_serie` (`numero_serie`),
  KEY `fk_equipos_tipo` (`tipo_equipo_id`),
  KEY `idx_equipos_estado` (`estado`),
  KEY `idx_equipos_hostname` (`hostname`),
  KEY `idx_equipos_mac` (`mac_address`),
  CONSTRAINT `fk_equipos_tipo` FOREIGN KEY (`tipo_equipo_id`) REFERENCES `tipos_equipo` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipos`
--

LOCK TABLES `equipos` WRITE;
/*!40000 ALTER TABLE `equipos` DISABLE KEYS */;
INSERT INTO `equipos` VALUES (1,1,'hp','2200','15','012258444','intel','15','512','n/a','amd ryzen','windows','C8:94:02:40:AA:FD','gifyudfhddfd',NULL,'asignado','excelente','kgffffddfdcvbcxfdfdfd','2026-09-20 16:49:46','2026-09-24 14:46:08','2026-09-01','2026-09-25','n/a','4cc2b304-4a6c-4fb5-95f6-e0d628fbb7a9.png',NULL,_binary '�xj6�-D\�\�\�)�&�5\r�/\�qЈ*1�%T)�f̙^C�O');
/*!40000 ALTER TABLE `equipos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `impresoras`
--

DROP TABLE IF EXISTS `impresoras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `impresoras` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codigo_inventario` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_impresora_id` int unsigned NOT NULL,
  `marca` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_serie` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mac_address` varchar(17) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hostname` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ubicacion_id` int unsigned DEFAULT NULL,
  `estado` enum('disponible','asignado','mantenimiento','reparacion','baja','perdido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'disponible',
  `tipo_conexion` enum('usb','red','wifi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imprime_color` tinyint(1) NOT NULL DEFAULT '0',
  `duplex` tinyint(1) NOT NULL DEFAULT '0',
  `contador_impresiones` int unsigned DEFAULT NULL,
  `fecha_compra` date DEFAULT NULL,
  `garantia_vence` date DEFAULT NULL,
  `garantia_detalle` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_baja` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_impresoras_codigo` (`codigo_inventario`),
  UNIQUE KEY `uq_impresoras_serie` (`numero_serie`),
  KEY `fk_impresoras_tipo` (`tipo_impresora_id`),
  KEY `idx_impresoras_estado` (`estado`),
  KEY `idx_impresoras_marca` (`marca`),
  KEY `idx_impresoras_ubicacion` (`ubicacion_id`),
  KEY `idx_impresoras_ip` (`ip`),
  KEY `idx_impresoras_mac` (`mac_address`),
  CONSTRAINT `fk_impresoras_tipo` FOREIGN KEY (`tipo_impresora_id`) REFERENCES `tipos_impresora` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_impresoras_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `impresoras`
--

LOCK TABLES `impresoras` WRITE;
/*!40000 ALTER TABLE `impresoras` DISABLE KEYS */;
/*!40000 ALTER TABLE `impresoras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `licencias`
--

DROP TABLE IF EXISTS `licencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licencias` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `software_id` int unsigned NOT NULL,
  `proveedor_id` int unsigned DEFAULT NULL,
  `modelo_id` int unsigned NOT NULL,
  `cantidad_total` smallint unsigned NOT NULL DEFAULT '1',
  `activaciones_maximas` smallint unsigned DEFAULT NULL,
  `transferible` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_compra` date DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `periodicidad` enum('unica','mensual','anual','bianual','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unica',
  `renovacion_automatica` tinyint(1) NOT NULL DEFAULT '0',
  `costo` decimal(12,2) unsigned DEFAULT NULL,
  `moneda` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MXN',
  `numero_contrato` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_factura` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `renovacion_de_id` int unsigned DEFAULT NULL,
  `estado` enum('activa','suspendida','cancelada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `creado_por` int unsigned DEFAULT NULL,
  `actualizado_por` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_licencias_codigo` (`codigo`),
  KEY `fk_licencias_proveedor` (`proveedor_id`),
  KEY `fk_licencias_modelo` (`modelo_id`),
  KEY `fk_licencias_renovacion` (`renovacion_de_id`),
  KEY `fk_licencias_creado_por` (`creado_por`),
  KEY `fk_licencias_actualizado` (`actualizado_por`),
  KEY `idx_licencias_software` (`software_id`),
  KEY `idx_licencias_vencimiento` (`fecha_vencimiento`,`estado`),
  KEY `idx_licencias_estado` (`estado`),
  CONSTRAINT `fk_licencias_actualizado` FOREIGN KEY (`actualizado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_licencias_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_licencias_modelo` FOREIGN KEY (`modelo_id`) REFERENCES `modelos_licencia` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_licencias_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_licencias_renovacion` FOREIGN KEY (`renovacion_de_id`) REFERENCES `licencias` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_licencias_software` FOREIGN KEY (`software_id`) REFERENCES `software` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_licencias_cantidad` CHECK ((`cantidad_total` >= 1)),
  CONSTRAINT `chk_licencias_fechas` CHECK (((`fecha_inicio` is null) or (`fecha_vencimiento` is null) or (`fecha_vencimiento` >= `fecha_inicio`)))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `licencias`
--

LOCK TABLES `licencias` WRITE;
/*!40000 ALTER TABLE `licencias` DISABLE KEYS */;
INSERT INTO `licencias` VALUES (1,'LIC-00001',1,NULL,1,5,5,1,'2026-09-22','2026-09-22',NULL,'unica',0,NULL,'MXN',NULL,NULL,NULL,'activa',NULL,1,1,'2026-09-22 10:42:26','2026-09-22 10:42:26');
/*!40000 ALTER TABLE `licencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mantenimientos`
--

DROP TABLE IF EXISTS `mantenimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mantenimientos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `folio` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `anio` smallint unsigned NOT NULL,
  `consecutivo` int unsigned NOT NULL,
  `tipo` enum('preventivo','correctivo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_recurso` enum('EQUIPO','ACCESORIO','IMPRESORA','CELULAR') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `equipo_id` int unsigned DEFAULT NULL,
  `accesorio_id` int unsigned DEFAULT NULL,
  `impresora_id` int unsigned DEFAULT NULL,
  `celular_id` int unsigned DEFAULT NULL,
  `estado` enum('programado','en_proceso','realizado','reprogramado','cancelado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'programado',
  `prioridad` enum('alta','media','baja') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'media',
  `fecha_programada` date NOT NULL,
  `hora_programada` time DEFAULT NULL,
  `motivo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_realizado` date DEFAULT NULL,
  `trabajo_realizado` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `costo` decimal(10,2) unsigned DEFAULT NULL,
  `proveedor` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `responsable_id` int unsigned DEFAULT NULL,
  `reprogramado_de` int unsigned DEFAULT NULL,
  `motivo_cancelacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `creado_por` int unsigned DEFAULT NULL,
  `actualizado_por` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `recurso_id` int unsigned GENERATED ALWAYS AS (coalesce(`equipo_id`,`accesorio_id`,`impresora_id`,`celular_id`)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mant_folio` (`folio`),
  UNIQUE KEY `uq_mant_consecutivo` (`anio`,`consecutivo`),
  KEY `fk_mant_equipo` (`equipo_id`),
  KEY `fk_mant_accesorio` (`accesorio_id`),
  KEY `fk_mant_impresora` (`impresora_id`),
  KEY `fk_mant_celular` (`celular_id`),
  KEY `fk_mant_responsable` (`responsable_id`),
  KEY `fk_mant_reprog` (`reprogramado_de`),
  KEY `fk_mant_creado_por` (`creado_por`),
  KEY `fk_mant_actualizado` (`actualizado_por`),
  KEY `idx_mant_calendario` (`fecha_programada`,`estado`),
  KEY `idx_mant_estado` (`estado`,`fecha_programada`),
  KEY `idx_mant_unidad` (`tipo_recurso`,`recurso_id`,`fecha_programada`),
  KEY `idx_mant_tipo` (`tipo`),
  CONSTRAINT `fk_mant_accesorio` FOREIGN KEY (`accesorio_id`) REFERENCES `accesorios` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mant_actualizado` FOREIGN KEY (`actualizado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mant_celular` FOREIGN KEY (`celular_id`) REFERENCES `celulares` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mant_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mant_equipo` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mant_impresora` FOREIGN KEY (`impresora_id`) REFERENCES `impresoras` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mant_reprog` FOREIGN KEY (`reprogramado_de`) REFERENCES `mantenimientos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mant_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_mant_realizado` CHECK (((`estado` <> _utf8mb4'realizado') or ((`fecha_realizado` is not null) and (`trabajo_realizado` is not null)))),
  CONSTRAINT `chk_mant_una_unidad` CHECK ((((((`equipo_id` is not null) + (`accesorio_id` is not null)) + (`impresora_id` is not null)) + (`celular_id` is not null)) = 1))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mantenimientos`
--

LOCK TABLES `mantenimientos` WRITE;
/*!40000 ALTER TABLE `mantenimientos` DISABLE KEYS */;
INSERT INTO `mantenimientos` (`id`, `folio`, `anio`, `consecutivo`, `tipo`, `tipo_recurso`, `equipo_id`, `accesorio_id`, `impresora_id`, `celular_id`, `estado`, `prioridad`, `fecha_programada`, `hora_programada`, `motivo`, `fecha_realizado`, `trabajo_realizado`, `costo`, `proveedor`, `responsable_id`, `reprogramado_de`, `motivo_cancelacion`, `observaciones`, `creado_por`, `actualizado_por`, `created_at`, `updated_at`) VALUES (1,'MNT-2026-000001',2026,1,'preventivo','EQUIPO',1,NULL,NULL,NULL,'programado','media','2026-09-22','13:45:00','limpieza',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'2026-09-22 10:46:16','2026-09-22 10:46:16');
/*!40000 ALTER TABLE `mantenimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mantenimientos_componentes`
--

DROP TABLE IF EXISTS `mantenimientos_componentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mantenimientos_componentes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `mantenimiento_id` int unsigned NOT NULL,
  `accion` enum('instalado','reemplazado','retirado','actualizado','limpiado','revisado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `componente` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_serie` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `costo` decimal(10,2) unsigned DEFAULT NULL,
  `orden` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mant_comp_mantenimiento` (`mantenimiento_id`,`orden`),
  KEY `idx_mant_comp_componente` (`componente`),
  CONSTRAINT `fk_mant_comp_mantenimiento` FOREIGN KEY (`mantenimiento_id`) REFERENCES `mantenimientos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mantenimientos_componentes`
--

LOCK TABLES `mantenimientos_componentes` WRITE;
/*!40000 ALTER TABLE `mantenimientos_componentes` DISABLE KEYS */;
/*!40000 ALTER TABLE `mantenimientos_componentes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modelos_licencia`
--

DROP TABLE IF EXISTS `modelos_licencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modelos_licencia` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ambito` enum('usuario','dispositivo','ambos') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ambos',
  `temporalidad` enum('perpetua','suscripcion') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'suscripcion',
  `requiere_desactivacion` tinyint(1) NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `orden` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_modelos_licencia_codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modelos_licencia`
--

LOCK TABLES `modelos_licencia` WRITE;
/*!40000 ALTER TABLE `modelos_licencia` DISABLE KEYS */;
INSERT INTO `modelos_licencia` VALUES (1,'perpetua','Perpetua','ambos','perpetua',0,1,10),(2,'suscripcion_mensual','Suscripción mensual','ambos','suscripcion',0,1,20),(3,'suscripcion_anual','Suscripción anual','ambos','suscripcion',0,1,30),(4,'por_usuario','Por usuario','usuario','suscripcion',0,1,40),(5,'por_dispositivo','Por dispositivo','dispositivo','suscripcion',1,1,50),(6,'volumen','Por volumen','ambos','suscripcion',0,1,60),(7,'concurrente','Concurrente','usuario','suscripcion',0,1,70),(8,'por_activacion','Por activación','dispositivo','suscripcion',1,1,80),(9,'otro','Otro','ambos','suscripcion',0,1,90);
/*!40000 ALTER TABLE `modelos_licencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion_preferencias`
--

DROP TABLE IF EXISTS `notificacion_preferencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion_preferencias` (
  `usuario_id` int unsigned NOT NULL,
  `categoria` enum('inventario','mantenimientos','garantias','licencias','redes') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `canal_sistema` tinyint(1) NOT NULL DEFAULT '1',
  `canal_correo` tinyint(1) NOT NULL DEFAULT '0',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_id`,`categoria`),
  CONSTRAINT `fk_notifpref_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion_preferencias`
--

LOCK TABLES `notificacion_preferencias` WRITE;
/*!40000 ALTER TABLE `notificacion_preferencias` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacion_preferencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `tipo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prioridad` enum('critica','advertencia','info') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `modulo` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entidad_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enlace` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol_destinatario` enum('admin','technician','viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `clave_dedup` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_leida` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notif_dedup` (`usuario_id`,`clave_dedup`),
  KEY `idx_notif_usuario_leida` (`usuario_id`,`leida`,`created_at`),
  KEY `idx_notif_usuario_created` (`usuario_id`,`created_at`),
  CONSTRAINT `fk_notif_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=393 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,1,'mantenimiento_hoy','Mantenimiento programado para hoy','El mantenimiento de hp 2200 está programado para hoy.','advertencia','mantenimientos','1','/mantenimientos?dia=Tue Sep 22 2026 00:00:00 GMT-0600 (hora estándar central)','admin','mantenimiento_hoy:mantenimientos:1',1,'2026-09-22 22:42:05','2026-09-22 22:41:51'),(2,1,'garantia_7d','Garantía próxima a vencer','El equipo 15 vence su garantía en 3 día(s).','advertencia','equipos','1','/equipos/1','admin','garantia_7d:equipos:1',1,'2026-09-22 22:42:05','2026-09-22 22:41:51'),(3,1,'garantia_7d','Garantía próxima a vencer','El equipo 151122 vence su garantía en 1 día(s).','advertencia','accesorios','3','/accesorios/3','admin','garantia_7d:accesorios:3',1,'2026-09-22 22:42:05','2026-09-22 22:41:51'),(4,1,'garantia_vencida','Garantía vencida','El equipo 15 tiene la garantía vencida desde hace 1 día(s).','critica','celulares','11','/celulares/11','admin','garantia_vencida:celulares:11',1,'2026-09-22 22:42:05','2026-09-22 22:41:51'),(74,1,'mantenimiento_vencido','Mantenimiento vencido','El mantenimiento de hp 2200 venció hace 1 día(s).','critica','mantenimientos','1','/mantenimientos?dia=Tue Sep 22 2026 00:00:00 GMT-0600 (hora estándar central)','admin','mantenimiento_vencido:mantenimientos:1',0,NULL,'2026-09-23 09:36:02'),(347,1,'garantia_vencida','Garantía vencida','El equipo 151122 tiene la garantía vencida desde hace 1 día(s).','critica','accesorios','3','/accesorios/3','admin','garantia_vencida:accesorios:3',0,NULL,'2026-09-24 14:41:50');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rfc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contacto_nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sitio_web` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proveedores_nombre` (`nombre`),
  KEY `idx_proveedores_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
INSERT INTO `proveedores` VALUES (1,'Microsoft',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-09-22 10:16:48','2026-09-22 10:16:48'),(2,'Adobe',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-09-22 10:16:48','2026-09-22 10:16:48'),(3,'Autodesk',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-09-22 10:16:48','2026-09-22 10:16:48'),(4,'Google',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-09-22 10:16:48','2026-09-22 10:16:48');
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `redes`
--

DROP TABLE IF EXISTS `redes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `redes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('wifi','lan','vlan','invitados','servidores','otra') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ubicacion_id` int unsigned DEFAULT NULL,
  `area_id` int unsigned DEFAULT NULL,
  `vlan_numero` smallint unsigned DEFAULT NULL,
  `rango_ip` varchar(43) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dns` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dhcp_habilitado` tinyint(1) NOT NULL DEFAULT '0',
  `seguridad_wifi` enum('wpa2','wpa3','wpa2_enterprise','wep','abierta','otra') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wifi_password_cifrado` varbinary(512) DEFAULT NULL,
  `estado` enum('activa','inactiva') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  `responsable_id` int unsigned DEFAULT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_por` int unsigned DEFAULT NULL,
  `actualizado_por` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `clave_unica` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (concat(lower(`nombre`),_utf8mb4':',coalesce(`ubicacion_id`,0))) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_redes_clave` (`clave_unica`),
  KEY `fk_redes_area` (`area_id`),
  KEY `fk_redes_responsable` (`responsable_id`),
  KEY `fk_redes_creado_por` (`creado_por`),
  KEY `fk_redes_actualizado` (`actualizado_por`),
  KEY `idx_redes_tipo` (`tipo`),
  KEY `idx_redes_estado` (`estado`),
  KEY `idx_redes_ubicacion` (`ubicacion_id`),
  CONSTRAINT `fk_redes_actualizado` FOREIGN KEY (`actualizado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_redes_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_redes_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_redes_responsable` FOREIGN KEY (`responsable_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_redes_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redes`
--

LOCK TABLES `redes` WRITE;
/*!40000 ALTER TABLE `redes` DISABLE KEYS */;
/*!40000 ALTER TABLE `redes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `name` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES ('001_colaboradores.sql','2026-09-20 14:20:27'),('002_equipos_accesorios_asignaciones.sql','2026-09-20 16:12:56'),('003_impresoras_celulares.sql','2026-09-20 21:19:51'),('004_cartas_responsivas.sql','2026-09-20 22:08:50'),('005_configuracion_cuenta_sesiones.sql','2026-09-21 10:40:49'),('006_mantenimientos.sql','2026-09-21 21:49:51'),('007_software_licencias.sql','2026-09-22 10:16:48'),('008_redes_dispositivos.sql','2026-09-22 11:12:40'),('009_notificaciones.sql','2026-09-22 22:41:47'),('010_configuracion_fase2.sql','2026-09-23 10:16:08');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `software`
--

DROP TABLE IF EXISTS `software`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `software` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fabricante_id` int unsigned DEFAULT NULL,
  `categoria_id` int unsigned DEFAULT NULL,
  `tipo` enum('comercial','gratuito','open_source','freeware','interno','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'comercial',
  `version_referencia` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requiere_licencia` tinyint(1) NOT NULL DEFAULT '1',
  `requiere_activacion` tinyint(1) NOT NULL DEFAULT '0',
  `sitio_web` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estado` enum('activo','descontinuado','no_permitido') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `creado_por` int unsigned DEFAULT NULL,
  `actualizado_por` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `clave_unica` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (concat(lower(`nombre`),_utf8mb4':',coalesce(`fabricante_id`,0))) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_software_clave` (`clave_unica`),
  KEY `fk_software_fabricante` (`fabricante_id`),
  KEY `fk_software_creado_por` (`creado_por`),
  KEY `fk_software_actualizado` (`actualizado_por`),
  KEY `idx_software_nombre` (`nombre`),
  KEY `idx_software_categoria` (`categoria_id`),
  KEY `idx_software_estado` (`estado`),
  KEY `idx_software_requiere_licencia` (`requiere_licencia`),
  CONSTRAINT `fk_software_actualizado` FOREIGN KEY (`actualizado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_software_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_software` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_software_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_software_fabricante` FOREIGN KEY (`fabricante_id`) REFERENCES `proveedores` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `software`
--

LOCK TABLES `software` WRITE;
/*!40000 ALTER TABLE `software` DISABLE KEYS */;
INSERT INTO `software` (`id`, `nombre`, `fabricante_id`, `categoria_id`, `tipo`, `version_referencia`, `requiere_licencia`, `requiere_activacion`, `sitio_web`, `descripcion`, `observaciones`, `estado`, `creado_por`, `actualizado_por`, `created_at`, `updated_at`) VALUES (1,'office',1,1,'comercial','2026',1,0,NULL,NULL,NULL,'activo',1,1,'2026-09-22 10:41:25','2026-09-22 10:41:25');
/*!40000 ALTER TABLE `software` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_accesorio`
--

DROP TABLE IF EXISTS `tipos_accesorio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_accesorio` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipos_accesorio_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_accesorio`
--

LOCK TABLES `tipos_accesorio` WRITE;
/*!40000 ALTER TABLE `tipos_accesorio` DISABLE KEYS */;
INSERT INTO `tipos_accesorio` VALUES (8,'Adaptador'),(4,'Audífonos'),(9,'Cable'),(7,'Cargador'),(6,'Docking station'),(3,'Monitor'),(1,'Mouse'),(10,'Otro'),(2,'Teclado'),(5,'Webcam');
/*!40000 ALTER TABLE `tipos_accesorio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_equipo`
--

DROP TABLE IF EXISTS `tipos_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_equipo` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipos_equipo_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_equipo`
--

LOCK TABLES `tipos_equipo` WRITE;
/*!40000 ALTER TABLE `tipos_equipo` DISABLE KEYS */;
INSERT INTO `tipos_equipo` VALUES (9,'All-in-One'),(1,'Laptop'),(8,'Otro'),(2,'PC'),(11,'Servidor'),(10,'Tablet');
/*!40000 ALTER TABLE `tipos_equipo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_impresora`
--

DROP TABLE IF EXISTS `tipos_impresora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_impresora` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipos_impresora_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_impresora`
--

LOCK TABLES `tipos_impresora` WRITE;
/*!40000 ALTER TABLE `tipos_impresora` DISABLE KEYS */;
INSERT INTO `tipos_impresora` VALUES (2,'Inyección de tinta'),(1,'Láser'),(4,'Matricial'),(6,'Multifuncional'),(8,'Otro'),(7,'Plotter'),(3,'Tanque de tinta'),(5,'Térmica');
/*!40000 ALTER TABLE `tipos_impresora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ubicaciones`
--

DROP TABLE IF EXISTS `ubicaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ubicaciones` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `area_id` int unsigned DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ubicaciones_nombre` (`nombre`),
  KEY `idx_ubicaciones_area` (`area_id`),
  CONSTRAINT `fk_ubicaciones_area` FOREIGN KEY (`area_id`) REFERENCES `areas` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ubicaciones`
--

LOCK TABLES `ubicaciones` WRITE;
/*!40000 ALTER TABLE `ubicaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `ubicaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned NOT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `reautenticado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_sessions_user` (`user_id`,`revoked_at`),
  KEY `idx_user_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
INSERT INTO `user_sessions` VALUES ('02d33cd2-beb8-46c5-ab08-e27cb78ae712',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0','::1','2026-09-21 20:53:18','2026-09-23 09:46:38','2026-10-21 20:53:18',NULL,NULL),('058ae281-6366-42fe-a933-b351e09b45c2',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','::1','2026-09-23 10:34:10','2026-09-23 10:34:10','2026-09-23 18:34:10',NULL,NULL),('0ef13c8e-8223-45d4-b333-d03a8ca6981f',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','::1','2026-09-23 10:52:03','2026-09-23 10:52:03','2026-09-23 18:52:03',NULL,NULL),('32fc3534-8cc8-4b6d-8cd0-82204fab4c4a',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0','::1','2026-09-23 10:03:36','2026-09-23 10:03:36','2026-10-23 10:03:36',NULL,NULL),('3ffe1cae-e47f-4667-abb1-b46e2a340e9d',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','::1','2026-09-23 10:33:13','2026-09-23 10:33:13','2026-09-23 18:33:13',NULL,NULL),('4f804e45-06d6-4388-8a87-391fdd6ccf46',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','::1','2026-09-23 10:59:10','2026-09-23 10:59:10','2026-09-23 18:59:10',NULL,NULL),('5059ddfb-5496-4a02-a1e6-5b836dd10c23',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','::1','2026-09-23 10:47:19','2026-09-23 10:47:19','2026-09-23 18:47:19',NULL,NULL),('6f7d8db2-1a0a-4c8e-8e5b-487be4dc9558',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','::1','2026-09-23 10:52:26','2026-09-23 10:52:26','2026-09-23 18:52:26',NULL,NULL),('a1bd686f-a206-4704-b656-23002140ccbb',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0','::1','2026-09-23 10:21:56','2026-09-23 10:59:35','2026-10-23 10:21:56',NULL,NULL),('a442bc11-1cb6-4060-80eb-e4889955895e',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0','::1','2026-09-23 10:06:19','2026-09-23 10:06:19','2026-10-23 10:06:19',NULL,NULL),('a9c8c0ee-c823-48a1-ab02-0a93a0bdcae8',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','::1','2026-09-23 16:42:35','2026-09-23 16:42:35','2026-10-23 16:42:35','2026-09-23 16:42:47',NULL),('b04ef662-eab0-4304-9c3b-1e4b970dfa10',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','::1','2026-09-23 16:43:01','2026-09-24 14:57:36','2026-10-23 16:43:01',NULL,NULL),('fef1dbc9-3675-4168-a45e-ffb42b99b708',1,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0','::1','2026-09-23 10:12:23','2026-09-23 10:12:23','2026-10-23 10:12:23',NULL,NULL);
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','technician','viewer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'viewer',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `telefono` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cargo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '0',
  `desactivado_en` datetime DEFAULT NULL,
  `desactivado_por` int unsigned DEFAULT NULL,
  `preferencias_ui` json DEFAULT NULL,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_active` (`active`),
  KEY `fk_users_desactivado_por` (`desactivado_por`),
  CONSTRAINT `fk_users_desactivado_por` FOREIGN KEY (`desactivado_por`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrador','Administrador',NULL,'admin','admin@techcontrol.local','$2a$12$IHEfPNf8t9PkQyK9k345UOLuk6lWlHzDZSAD7teg.JL.Z2m0vmSGK','admin',1,'2026-09-23 16:43:01','2026-09-20 13:47:39','2026-09-23 16:43:01',NULL,NULL,'8a017685-c9c2-4d4b-810a-5cc3631c2261.png',NULL,0,NULL,NULL,'{\"tema\": \"claro\", \"acento\": \"azul\", \"densidad\": \"comoda\"}',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_asignaciones_vigentes`
--

DROP TABLE IF EXISTS `v_asignaciones_vigentes`;
/*!50001 DROP VIEW IF EXISTS `v_asignaciones_vigentes`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_asignaciones_vigentes` AS SELECT 
 1 AS `colaborador_id`,
 1 AS `categoria`,
 1 AS `asignacion_id`,
 1 AS `item_id`,
 1 AS `codigo_inventario`,
 1 AS `tipo`,
 1 AS `descripcion`,
 1 AS `numero_serie`,
 1 AS `fecha_asignacion`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_licencias_uso`
--

DROP TABLE IF EXISTS `v_licencias_uso`;
/*!50001 DROP VIEW IF EXISTS `v_licencias_uso`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_licencias_uso` AS SELECT 
 1 AS `licencia_id`,
 1 AS `cantidad_total`,
 1 AS `utilizadas`,
 1 AS `disponibles`,
 1 AS `dias_para_vencer`,
 1 AS `estado_efectivo`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_recursos_inventario`
--

DROP TABLE IF EXISTS `v_recursos_inventario`;
/*!50001 DROP VIEW IF EXISTS `v_recursos_inventario`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_recursos_inventario` AS SELECT 
 1 AS `tipo_recurso`,
 1 AS `item_id`,
 1 AS `codigo_inventario`,
 1 AS `titulo`,
 1 AS `tipo`,
 1 AS `estado`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_asignaciones_vigentes`
--

/*!50001 DROP VIEW IF EXISTS `v_asignaciones_vigentes`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_asignaciones_vigentes` AS select `a`.`colaborador_id` AS `colaborador_id`,'EQUIPO' AS `categoria`,`a`.`id` AS `asignacion_id`,`e`.`id` AS `item_id`,`e`.`codigo_inventario` AS `codigo_inventario`,`t`.`nombre` AS `tipo`,trim(concat_ws(' ',`e`.`marca`,`e`.`modelo`)) AS `descripcion`,`e`.`numero_serie` AS `numero_serie`,`a`.`fecha_asignacion` AS `fecha_asignacion` from ((`asignaciones_equipos` `a` join `equipos` `e` on((`e`.`id` = `a`.`equipo_id`))) join `tipos_equipo` `t` on((`t`.`id` = `e`.`tipo_equipo_id`))) where (`a`.`fecha_devolucion` is null) union all select `a`.`colaborador_id` AS `colaborador_id`,'ACCESORIO' AS `ACCESORIO`,`a`.`id` AS `id`,`x`.`id` AS `id`,`x`.`codigo_inventario` AS `codigo_inventario`,`t`.`nombre` AS `nombre`,`x`.`nombre` AS `nombre`,`x`.`numero_serie` AS `numero_serie`,`a`.`fecha_asignacion` AS `fecha_asignacion` from ((`asignaciones_accesorios` `a` join `accesorios` `x` on((`x`.`id` = `a`.`accesorio_id`))) join `tipos_accesorio` `t` on((`t`.`id` = `x`.`tipo_accesorio_id`))) where (`a`.`fecha_devolucion` is null) union all select `a`.`colaborador_id` AS `colaborador_id`,'IMPRESORA' AS `IMPRESORA`,`a`.`id` AS `id`,`p`.`id` AS `id`,`p`.`codigo_inventario` AS `codigo_inventario`,`t`.`nombre` AS `nombre`,trim(concat_ws(' ',`p`.`marca`,`p`.`modelo`)) AS `TRIM(CONCAT_WS(' ', p.marca, p.modelo))`,`p`.`numero_serie` AS `numero_serie`,`a`.`fecha_asignacion` AS `fecha_asignacion` from ((`asignaciones_impresoras` `a` join `impresoras` `p` on((`p`.`id` = `a`.`impresora_id`))) join `tipos_impresora` `t` on((`t`.`id` = `p`.`tipo_impresora_id`))) where (`a`.`fecha_devolucion` is null) union all select `a`.`colaborador_id` AS `colaborador_id`,'CELULAR' AS `CELULAR`,`a`.`id` AS `id`,`c`.`id` AS `id`,`c`.`codigo_inventario` AS `codigo_inventario`,'Celular' AS `Celular`,trim(concat_ws(' ',`c`.`marca`,`c`.`modelo`)) AS `TRIM(CONCAT_WS(' ', c.marca, c.modelo))`,`c`.`numero_serie` AS `numero_serie`,`a`.`fecha_asignacion` AS `fecha_asignacion` from (`asignaciones_celulares` `a` join `celulares` `c` on((`c`.`id` = `a`.`celular_id`))) where (`a`.`fecha_devolucion` is null) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_licencias_uso`
--

/*!50001 DROP VIEW IF EXISTS `v_licencias_uso`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_licencias_uso` AS select `l`.`id` AS `licencia_id`,`l`.`cantidad_total` AS `cantidad_total`,coalesce(`u`.`utilizadas`,0) AS `utilizadas`,(`l`.`cantidad_total` - coalesce(`u`.`utilizadas`,0)) AS `disponibles`,(to_days(`l`.`fecha_vencimiento`) - to_days(curdate())) AS `dias_para_vencer`,(case when (`l`.`estado` = 'cancelada') then 'cancelada' when (`l`.`estado` = 'suspendida') then 'suspendida' when ((`l`.`fecha_vencimiento` is not null) and (`l`.`fecha_vencimiento` < curdate())) then 'vencida' when ((`l`.`cantidad_total` - coalesce(`u`.`utilizadas`,0)) <= 0) then 'agotada' when ((`l`.`fecha_vencimiento` is not null) and (`l`.`fecha_vencimiento` <= (curdate() + interval 90 day))) then 'por_vencer' else 'activa' end) AS `estado_efectivo` from (`licencias` `l` left join (select `asignaciones_licencias`.`licencia_id` AS `licencia_id`,count(0) AS `utilizadas` from `asignaciones_licencias` where (`asignaciones_licencias`.`fecha_liberacion` is null) group by `asignaciones_licencias`.`licencia_id`) `u` on((`u`.`licencia_id` = `l`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_recursos_inventario`
--

/*!50001 DROP VIEW IF EXISTS `v_recursos_inventario`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_recursos_inventario` AS select 'EQUIPO' AS `tipo_recurso`,`e`.`id` AS `item_id`,`e`.`codigo_inventario` AS `codigo_inventario`,trim(concat_ws(' ',`e`.`marca`,`e`.`modelo`)) AS `titulo`,`t`.`nombre` AS `tipo`,`e`.`estado` AS `estado` from (`equipos` `e` join `tipos_equipo` `t` on((`t`.`id` = `e`.`tipo_equipo_id`))) union all select 'ACCESORIO' AS `ACCESORIO`,`a`.`id` AS `id`,`a`.`codigo_inventario` AS `codigo_inventario`,`a`.`nombre` AS `nombre`,`t`.`nombre` AS `nombre`,`a`.`estado` AS `estado` from (`accesorios` `a` join `tipos_accesorio` `t` on((`t`.`id` = `a`.`tipo_accesorio_id`))) union all select 'IMPRESORA' AS `IMPRESORA`,`p`.`id` AS `id`,`p`.`codigo_inventario` AS `codigo_inventario`,trim(concat_ws(' ',`p`.`marca`,`p`.`modelo`)) AS `TRIM(CONCAT_WS(' ', p.marca, p.modelo))`,`t`.`nombre` AS `nombre`,`p`.`estado` AS `estado` from (`impresoras` `p` join `tipos_impresora` `t` on((`t`.`id` = `p`.`tipo_impresora_id`))) union all select 'CELULAR' AS `CELULAR`,`c`.`id` AS `id`,`c`.`codigo_inventario` AS `codigo_inventario`,trim(concat_ws(' ',`c`.`marca`,`c`.`modelo`)) AS `TRIM(CONCAT_WS(' ', c.marca, c.modelo))`,'Celular' AS `Celular`,`c`.`estado` AS `estado` from `celulares` `c` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24 14:59:49
