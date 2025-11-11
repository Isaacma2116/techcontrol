-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: controlequip
-- ------------------------------------------------------
-- Server version	8.0.37

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
-- Table structure for table `auxiliares`
--

DROP TABLE IF EXISTS `auxiliares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxiliares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipo_id` int DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `auxiliares_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `colaboradores`
--

DROP TABLE IF EXISTS `colaboradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colaboradores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `creado_en` datetime NOT NULL,
  `actualizado_en` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `colaboradores_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `componentes_equipo`
--

DROP TABLE IF EXISTS `componentes_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `componentes_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipo_id` int DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text,
  `cantidad` int DEFAULT '1',
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `componentes_equipo_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipos`
--

DROP TABLE IF EXISTS `equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `colaborador_id` int DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `procesador` varchar(100) DEFAULT NULL,
  `ram` varchar(50) DEFAULT NULL,
  `almacenamiento` varchar(100) DEFAULT NULL,
  `sistema_operativo` varchar(100) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `estado` enum('activo','inactivo','en_reparacion','dado_de_baja') DEFAULT 'activo',
  `observaciones` text,
  `fecha_adquisicion` date DEFAULT NULL,
  `foto_equipo` varchar(255) DEFAULT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `color` varchar(7) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `colaborador_id` (`colaborador_id`),
  CONSTRAINT `equipos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `equipos_ibfk_2` FOREIGN KEY (`colaborador_id`) REFERENCES `colaboradores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipos_personalizacion`
--

DROP TABLE IF EXISTS `equipos_personalizacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipos_personalizacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipo_id` int NOT NULL,
  `color` varchar(7) DEFAULT NULL,
  `icono` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_equipo` (`equipo_id`),
  CONSTRAINT `equipos_personalizacion_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `licencia`
--

DROP TABLE IF EXISTS `licencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licencia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `software_id` int NOT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `contrasena` varchar(100) DEFAULT NULL,
  `clave_licencia` varchar(100) NOT NULL,
  `fecha_adquisicion` date DEFAULT NULL,
  `fecha_caducidad` date DEFAULT NULL,
  `tipo_licencia` enum('mensual','anual','vitalicia') NOT NULL,
  `estado` enum('activa','caducada','no_asignada') NOT NULL,
  `max_dispositivos` int DEFAULT '1',
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `software_id` (`software_id`),
  CONSTRAINT `licencia_ibfk_1` FOREIGN KEY (`software_id`) REFERENCES `software` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `licencia_equipo`
--

DROP TABLE IF EXISTS `licencia_equipo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `licencia_equipo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `licencia_id` int NOT NULL,
  `equipo_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `licencia_id` (`licencia_id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `licencia_equipo_ibfk_1` FOREIGN KEY (`licencia_id`) REFERENCES `licencia` (`id`) ON DELETE CASCADE,
  CONSTRAINT `licencia_equipo_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mantenimientos_detalles`
--

DROP TABLE IF EXISTS `mantenimientos_detalles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mantenimientos_detalles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mantenimiento_id` int NOT NULL,
  `fecha_realizada` datetime DEFAULT NULL,
  `estado_final_equipo` varchar(50) DEFAULT NULL,
  `detalles_trabajo` text,
  `partes_reemplazadas` text,
  `costo` decimal(10,2) DEFAULT NULL,
  `observaciones_finales` text,
  `proximo_mantenimiento` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mantenimiento_id` (`mantenimiento_id`),
  CONSTRAINT `mantenimientos_detalles_ibfk_1` FOREIGN KEY (`mantenimiento_id`) REFERENCES `mantenimientos_programados` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mantenimientos_programados`
--

DROP TABLE IF EXISTS `mantenimientos_programados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mantenimientos_programados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipo_id` int NOT NULL,
  `tipo_mantenimiento` enum('preventivo','correctivo') NOT NULL,
  `fecha_programada` datetime NOT NULL,
  `prioridad` enum('alta','media','baja') DEFAULT 'media',
  `descripcion` text,
  `estado` enum('pendiente','realizado','reprogramado','no_realizado') DEFAULT 'pendiente',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_reprogramada` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `mantenimientos_programados_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `software`
--

DROP TABLE IF EXISTS `software`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `software` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol` enum('admin','tecnico','usuario') DEFAULT 'usuario',
  `estado` enum('activo','inactivo') DEFAULT 'activo',
  `creado_en` datetime DEFAULT NULL,
  `actualizado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`),
  UNIQUE KEY `correo_2` (`correo`),
  UNIQUE KEY `correo_3` (`correo`),
  UNIQUE KEY `correo_4` (`correo`),
  UNIQUE KEY `correo_5` (`correo`),
  UNIQUE KEY `correo_6` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-10 18:50:31
