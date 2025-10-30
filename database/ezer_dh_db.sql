-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: paulorogge.mysql.database.azure.com    Database: ezer_dh
-- ------------------------------------------------------
-- Server version	8.0.42-azure

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
-- Table structure for table `avaliacao`
--

DROP TABLE IF EXISTS `avaliacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `avaliacao` (
  `id_avaliacao` int NOT NULL AUTO_INCREMENT,
  `id_colaborador` int NOT NULL,
  `id_avaliador` int NOT NULL,
  `data` date NOT NULL,
  `tipo` enum('90','180','360') NOT NULL,
  `nota` decimal(3,2) NOT NULL,
  `comentario` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_avaliacao`),
  KEY `id_colaborador` (`id_colaborador`),
  KEY `id_avaliador` (`id_avaliador`),
  KEY `idx_avaliacao_data` (`data`),
  CONSTRAINT `avaliacao_ibfk_1` FOREIGN KEY (`id_colaborador`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE,
  CONSTRAINT `avaliacao_ibfk_2` FOREIGN KEY (`id_avaliador`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `avaliacao`
--

LOCK TABLES `avaliacao` WRITE;
/*!40000 ALTER TABLE `avaliacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `avaliacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colaborador`
--

DROP TABLE IF EXISTS `colaborador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colaborador` (
  `id_colaborador` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `cpf` varchar(20) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `email_pessoal` varchar(255) DEFAULT NULL,
  `email_corporativo` varchar(255) DEFAULT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `remuneracao` decimal(10,2) DEFAULT NULL,
  `data_admissao` date DEFAULT NULL,
  `tipo_contrato` enum('CLT','Prestador de Serviço','Estagiário','Jovem Aprendiz') DEFAULT NULL,
  `status` enum('Ativo','Inativo') DEFAULT 'Ativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_colaborador`),
  UNIQUE KEY `cpf` (`cpf`),
  KEY `id_empresa` (`id_empresa`),
  KEY `idx_colaborador_cpf` (`cpf`),
  KEY `idx_colaborador_email_corp` (`email_corporativo`),
  CONSTRAINT `colaborador_ibfk_1` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colaborador`
--

LOCK TABLES `colaborador` WRITE;
/*!40000 ALTER TABLE `colaborador` DISABLE KEYS */;
INSERT INTO `colaborador` VALUES (8,7,'40931131812','BEATRIZ OLIVEIRA DE SOUSA','2000-03-04','biiaoliveira21@yahoo.com.br',NULL,NULL,'ANALISTA FISCAL III',3500.00,'2023-03-27','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(9,7,'94220492100','FERNANDA APARECIDA DA SILVA','1990-03-06','nanda_silva16@hotmail.com',NULL,NULL,'COORDENADORA DEP PESSOAL',4520.25,'2023-05-15','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(10,7,'93716069590','IGOR VITOR RODRIGUES DE AZEVEDO','1995-11-09','igor_vitor10@hotmail.com',NULL,NULL,'COORDENADOR FISCAL',5000.00,'2023-09-27','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(11,7,'12364396800','MARCIA ALEXANDRE DA SILVA TABATA','1973-06-23','tabatamarcia@hotmail.com',NULL,NULL,'AUXILIAR DE LIMPEZA',1518.00,'2024-09-02','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(12,7,'46440979930','ANDREA LUIZ NOGUEIRA','1984-07-16','anluizzn@gmail.com',NULL,NULL,'ANALISTA DEP PESSOAL III',4305.00,'2025-02-06','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(13,7,'10865754900','MARCIO ADRIANO DE OLIVEIRA JUNIOR','1999-04-28','marcioj232@gmail.com',NULL,NULL,'AUXILIAR FISCAL III',2163.00,'2025-03-28','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(14,7,'13225912964','ECHILEY VITORIA FANTE','2003-05-04','Echiley.fante.vitoria1@gmail.com',NULL,NULL,'AUXILIAR ADMINISTRATITVO I',1926.75,'2025-04-22','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(15,7,'13286208914','JULIA PAES BATISTA','2001-01-03','juliabatista698@gmail.com',NULL,NULL,'AUX FOLHA DE PAGAMENTO I',1926.75,'2025-04-29','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(16,7,'95167722004','SARA MAYUMI KOIKE TANAHASHI','1980-05-16','saramkoike@hotmail.com',NULL,NULL,'ANALISTA FINANCEIRO III',3500.00,'2025-05-12','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(17,7,'86923099900','ANA CARLA STELLE','1974-02-09',NULL,'comercial@serracontabil.com.br',NULL,'SECRETÁRIA',3500.00,'2025-05-14','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(18,7,'10120163900','MARCELLO LEONARDI CACIOLATO','1999-01-20',NULL,'comercial1@serracontabil.com.br',NULL,'SDR COMERCIAL',2000.00,'2025-09-03','CLT','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(19,7,'8458980940','JESSICA CAROLINA BARBOSA DE OLIVEIRA',NULL,NULL,NULL,NULL,'SOCIETÁRIO',3400.00,'2025-09-22','Prestador de Serviço','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(20,7,'7524027907','LUCAS FIGUEIREDO','1991-02-03',NULL,'gerente.comercial@serracontabil.com.br',NULL,'COMERCIAL',2500.00,'2025-01-01','Prestador de Serviço','Ativo','2025-10-26 14:23:50','2025-10-26 14:23:50'),(21,8,'30585528829','ALESSANDRA ALVES DINIZ','1982-02-25',NULL,'alessandra.diniz@allumecontabilidade.com.br','(11) 97569-2346','ANALISTA FINANCEIRO JR',NULL,'2024-12-02','CLT','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(22,8,'34627836880','DAIANNE DANIELLA APARECIDA ANDRE','1988-09-03',NULL,'daianne.andre@allumecontabilidade.com.br','(11) 96466-0537','ANALISTA CONTABIL',NULL,'2024-06-10','CLT','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(23,8,'28893044854','DEISE CONCEIÇÃO CARVALHO GALDINO DA SILVA','1981-01-16',NULL,'deise.galdino@allumecontabilidade.com.br','(11) 99822-9981','COORDENADOR FISCAL E CONTABIL',NULL,'2021-11-01','CLT','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(24,8,'06293885554','EDILEUZA ROSA DOS SANTOS','1994-03-10',NULL,'edileuza.santos@allumecontabilidade.com.br','(11) 97453-7169','AUXILIAR CONTABIL',NULL,'2025-01-20','CLT','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(25,8,'45047312828','GRAZIELLE LIMA DOS SANTOS','1997-08-10',NULL,'graziele.santos@allumecontabilidade.com.br','(11) 98667-1796','AUXILIAR FISCAL',NULL,'2025-02-10','CLT','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(26,8,'19186705873','KALINKA RAQUEL DE AQUINO','1973-01-28',NULL,'kalinka.raquel@allumecontabilidade.com.br','(11) 91970-3671','ANALISTA CONTABIL PL',NULL,'2024-08-26','CLT','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(27,8,'19579595844','LUCIENE DE JESUS SANTOS','1977-10-24',NULL,'luciene.santos@allumecontabilidade.com.br','(11) 95356-0698','ANALISTA FISCAL',NULL,'2023-04-17','CLT','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(28,8,'31601341806','PATRICIA ANA DO RAMOS GOMES','1983-03-22',NULL,'patricia.gomes@allumecontabilidade.com.br','(11) 99257-5182','ANALISTA FISCAL SR',NULL,NULL,'Prestador de Serviço','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(29,8,'35167073804','RAQUEL SANTOS PEREIRA','1986-12-05',NULL,'raquel.pereira@allumecontabilidade.com.br','(11) 96699-1664','COORDENADORA DEP PESSOAL/ RELAÇÕES TRAB',NULL,'2017-02-01','CLT','Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(30,8,'13647893889','REGINA FERREIRA BARBOSA','1974-09-01',NULL,'regina.barbosa@allumecontabilidade.com.br','(11) 96474-9248','CEO',NULL,NULL,NULL,'Ativo','2025-10-26 14:27:58','2025-10-26 14:27:58'),(38,14,'55517313833','ANA JULIA SILVA FELIX','2005-12-29',NULL,'afelix@controleagora.com','11 95754-8662','AUX. FISCAL II',NULL,'2025-03-01','CLT','Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(39,14,'38895394836','GUSTAVO FERIGOLLI CAMACHO DO NASCIMENTO','1990-09-12',NULL,'gferigolli@controleagora.com','11 95208-0410','SOCIO/ ADM/ DP/ FINANCEIRO',NULL,'2021-03-11',NULL,'Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(40,14,'50419018808','HELLEN CRISTINA DOS SANTOS SOUSA','2001-11-05',NULL,'hsousa@controleagora.com','11 96034-2916','ASSIST. DE DEPARTAMENTO PESSOAL I',NULL,'2024-07-01','CLT','Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(41,14,'52017797863','JOAO VITOR LAGE FERNANDES','2002-05-08',NULL,'jlage@controleagora.com','11 95384-6650','SUPERVISOR OPERACIONAL',NULL,'2023-01-02','CLT','Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(42,14,'43955151859','JULIA MORGAN DO NASCIMENTO','1999-10-22',NULL,'jmorgan@controleagora.com','11 95683-4923','ASSISTENTE CONTABIL I',NULL,'2025-08-25','CLT','Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(43,14,'36278902800','JULIANA SANTANA DO SACRAMENTO LEAL','1998-03-30',NULL,'jleal@controleagora.com','11 99023-6168','ANAL. DE DEPARTAMENTO PESSOAL I',NULL,'2024-07-01','CLT','Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(44,14,'32719702897','KATIA REGINA SANTOS NATALI','1984-11-27',NULL,'knatali@controleagora.com','11 99534-2374','ANAL. CONTABIL I',NULL,'2025-04-16','CLT','Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(45,14,'22372659847','LEANDRO GOYA','1979-09-29',NULL,'lgoya@controleagora.com','11 97331-8273','SÓCIO',NULL,'2009-11-24',NULL,'Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(46,14,'51891791842','RAPHAEL SANTANA GOMES TEIXEIRA','2001-09-13',NULL,'rteixeira@controleagora.com','11 96783-9135','ASSIST. FISCAL II',NULL,'2025-09-15','CLT','Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(47,14,'40352228873','SAMUEL DOS SANTOS LOPES','1991-08-01',NULL,'slopes@controlagora.com','11 96585-2598','SOCIO/FISCAL/CONTABIL',NULL,'2021-03-17',NULL,'Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24'),(48,14,'49061406889','THAYS STHEFANY DE SOUSA SOTERO','2000-11-06',NULL,'tsotero@controleagora.com','11 93093-9332','ASSIST. ADMINISTRATIVO',NULL,'2024-08-12','CLT','Ativo','2025-10-26 14:33:24','2025-10-26 14:33:24');
/*!40000 ALTER TABLE `colaborador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `colaborador_departamento`
--

DROP TABLE IF EXISTS `colaborador_departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colaborador_departamento` (
  `id_colaborador` int NOT NULL,
  `id_departamento` int NOT NULL,
  PRIMARY KEY (`id_colaborador`,`id_departamento`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `colaborador_departamento_ibfk_1` FOREIGN KEY (`id_colaborador`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE,
  CONSTRAINT `colaborador_departamento_ibfk_2` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `colaborador_departamento`
--

LOCK TABLES `colaborador_departamento` WRITE;
/*!40000 ALTER TABLE `colaborador_departamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `colaborador_departamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultoria`
--

DROP TABLE IF EXISTS `consultoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultoria` (
  `id_consultoria` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `status` enum('Ativo','Inativo') DEFAULT 'Ativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_consultoria`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultoria`
--

LOCK TABLES `consultoria` WRITE;
/*!40000 ALTER TABLE `consultoria` DISABLE KEYS */;
INSERT INTO `consultoria` VALUES (2,'Ezer Consultoria','contato@ezer.com','(11) 99999-9999','Ativo','2025-10-05 01:22:53','2025-10-05 01:22:53'),(3,'Ezer Consultoria','contato@ezer.com','(11) 99999-9999','Ativo','2025-10-05 02:29:10','2025-10-05 02:29:10'),(4,'Ezer Consultoria','contato@ezer.com','(11) 99999-9999','Ativo','2025-10-17 00:46:48','2025-10-17 00:46:48'),(5,'Ezer Consultoria','contato@ezer.com','(11) 99999-9999','Ativo','2025-10-20 02:25:58','2025-10-20 02:25:58'),(6,'Ezer Consultoria','contato@ezer.com','(11) 99999-9999','Ativo','2025-10-28 14:15:19','2025-10-28 14:15:19'),(7,'Ezer Consultoria','contato@ezer.com','(11) 99999-9999','Ativo','2025-10-28 14:49:43','2025-10-28 14:49:43');
/*!40000 ALTER TABLE `consultoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departamento`
--

DROP TABLE IF EXISTS `departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamento` (
  `id_departamento` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `descricao` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_departamento`),
  KEY `id_empresa` (`id_empresa`),
  CONSTRAINT `departamento_ibfk_1` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departamento`
--

LOCK TABLES `departamento` WRITE;
/*!40000 ALTER TABLE `departamento` DISABLE KEYS */;
INSERT INTO `departamento` VALUES (6,7,'FISCAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(7,7,'COMERCIAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(8,7,'DEP. PESSOAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(9,7,'CONTABIL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(10,7,'SOCIETÁRIO',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(11,7,'FINANCEIRO',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(12,7,'ATENDIMENTO',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(13,8,'CONTABIL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(14,8,'DEP. PESSOAL/RH',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(15,8,'FISCAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(16,8,'ADMINISTRATIVO',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(17,9,'COMERCIAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(18,9,'SETOR TECNICO',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(19,9,'SETOR OPERACIONAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(20,9,'MARKETING',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(21,9,'ADMINISTRATIVO',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(22,10,'FISCAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(23,10,'ADMINISTRATIVO',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(24,10,'CONTABIL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(25,10,'RH',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(26,11,'CONTABIL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(27,11,'FISCAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(28,11,'DEP. PESSOAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(29,13,'FISCAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(30,13,'CONTABIL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(31,13,'DEP. PESSOAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(32,13,'COMERCIAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(33,13,'FINANCEIRO',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(34,12,'DEP. PESSOAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(35,12,'FISCAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(36,12,'CONTABIL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(37,15,'FISCAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(38,15,'CONTABIL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10'),(39,15,'DEP. PESSOAL',NULL,'2025-10-26 14:22:10','2025-10-26 14:22:10');
/*!40000 ALTER TABLE `departamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresa`
--

DROP TABLE IF EXISTS `empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa` (
  `id_empresa` int NOT NULL AUTO_INCREMENT,
  `id_consultoria` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `cnpj` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telefone` varchar(50) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `responsavel` varchar(255) DEFAULT NULL,
  `status` enum('Ativo','Inativo') DEFAULT 'Ativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_empresa`),
  UNIQUE KEY `cnpj` (`cnpj`),
  KEY `id_consultoria` (`id_consultoria`),
  CONSTRAINT `empresa_ibfk_1` FOREIGN KEY (`id_consultoria`) REFERENCES `consultoria` (`id_consultoria`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa`
--

LOCK TABLES `empresa` WRITE;
/*!40000 ALTER TABLE `empresa` DISABLE KEYS */;
INSERT INTO `empresa` VALUES (7,2,'SERRA ASSESSORIA','14.941.758/0001-39',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:48','2025-10-20 21:17:44'),(8,2,'ALLUME CONTABILIDADE','54.800.795/0001-41',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:49','2025-10-23 00:00:43'),(9,2,'KATO AMBIENTAL','42.590.517/0001-28',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:49','2025-10-20 21:16:49'),(10,2,'PROVISÃO CONTÁBIL','64.014.897/0001-95',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:49','2025-10-20 21:16:49'),(11,2,'NORTHGROUP','40.122.093/0001-41',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:50','2025-10-20 21:16:50'),(12,2,'MCLS SERVIÇOS CONTABEIS','20.102.659/0001-66',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:50','2025-10-20 21:16:50'),(13,2,'CONSIL CONTABILIDADE','45.420.869/0001-23',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:50','2025-10-20 21:21:35'),(14,2,'CONTROLE AGORA','51.944.380/0001-53',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:50','2025-10-20 21:16:50'),(15,2,'FEGMA CONTABILIDADE','55.715.620/0001-07',NULL,NULL,NULL,NULL,'Ativo','2025-10-20 21:16:51','2025-10-20 21:20:49');
/*!40000 ALTER TABLE `empresa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id_feedback` int NOT NULL AUTO_INCREMENT,
  `id_avaliador` int NOT NULL,
  `id_avaliado` int NOT NULL,
  `data` date NOT NULL,
  `classificacao` enum('Positivo','Para Melhorar','Neutro') NOT NULL,
  `observacoes` text,
  `tipo_feedback` enum('Liderado','360º') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_feedback`),
  KEY `id_avaliador` (`id_avaliador`),
  KEY `id_avaliado` (`id_avaliado`),
  KEY `idx_feedback_data` (`data`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`id_avaliador`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE,
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`id_avaliado`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lider`
--

DROP TABLE IF EXISTS `lider`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lider` (
  `id_lider` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int NOT NULL,
  `id_colaborador` int NOT NULL,
  `status` enum('Ativo','Inativo') DEFAULT 'Ativo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_lider`),
  UNIQUE KEY `uk_lider_colaborador` (`id_colaborador`),
  KEY `id_empresa` (`id_empresa`),
  CONSTRAINT `lider_ibfk_1` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`) ON DELETE CASCADE,
  CONSTRAINT `lider_ibfk_2` FOREIGN KEY (`id_colaborador`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lider`
--

LOCK TABLES `lider` WRITE;
/*!40000 ALTER TABLE `lider` DISABLE KEYS */;
/*!40000 ALTER TABLE `lider` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lider_departamento`
--

DROP TABLE IF EXISTS `lider_departamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lider_departamento` (
  `id_lider` int NOT NULL,
  `id_departamento` int NOT NULL,
  PRIMARY KEY (`id_lider`,`id_departamento`),
  KEY `id_departamento` (`id_departamento`),
  CONSTRAINT `lider_departamento_ibfk_1` FOREIGN KEY (`id_lider`) REFERENCES `lider` (`id_lider`) ON DELETE CASCADE,
  CONSTRAINT `lider_departamento_ibfk_2` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lider_departamento`
--

LOCK TABLES `lider_departamento` WRITE;
/*!40000 ALTER TABLE `lider_departamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `lider_departamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lider_membro`
--

DROP TABLE IF EXISTS `lider_membro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lider_membro` (
  `id_lider` int NOT NULL,
  `id_liderado` int NOT NULL,
  PRIMARY KEY (`id_lider`,`id_liderado`),
  KEY `id_liderado` (`id_liderado`),
  CONSTRAINT `lider_membro_ibfk_1` FOREIGN KEY (`id_lider`) REFERENCES `lider` (`id_lider`) ON DELETE CASCADE,
  CONSTRAINT `lider_membro_ibfk_2` FOREIGN KEY (`id_liderado`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lider_membro`
--

LOCK TABLES `lider_membro` WRITE;
/*!40000 ALTER TABLE `lider_membro` DISABLE KEYS */;
/*!40000 ALTER TABLE `lider_membro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocorrencia`
--

DROP TABLE IF EXISTS `ocorrencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocorrencia` (
  `id_ocorrencia` int NOT NULL AUTO_INCREMENT,
  `id_colaborador` int NOT NULL,
  `data` date NOT NULL,
  `classificacao` enum('Positivo','Negativo','Neutro') NOT NULL,
  `tipo` enum('Saúde Ocupacional','Ausência','Carreira') NOT NULL,
  `subtipo` varchar(255) DEFAULT NULL,
  `observacoes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_ocorrencia`),
  KEY `id_colaborador` (`id_colaborador`),
  CONSTRAINT `ocorrencia_ibfk_1` FOREIGN KEY (`id_colaborador`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocorrencia`
--

LOCK TABLES `ocorrencia` WRITE;
/*!40000 ALTER TABLE `ocorrencia` DISABLE KEYS */;
/*!40000 ALTER TABLE `ocorrencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ocorrencia_anexo`
--

DROP TABLE IF EXISTS `ocorrencia_anexo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ocorrencia_anexo` (
  `id_anexo` int NOT NULL AUTO_INCREMENT,
  `id_ocorrencia` int NOT NULL,
  `url` varchar(1024) NOT NULL,
  `nome_arquivo` varchar(512) NOT NULL,
  `content_type` varchar(128) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_anexo`),
  KEY `idx_ocorrencia_anexo_ocorrencia` (`id_ocorrencia`),
  KEY `idx_ocorrencia_anexo_url` (`url`(255)),
  CONSTRAINT `ocorrencia_anexo_ibfk_1` FOREIGN KEY (`id_ocorrencia`) REFERENCES `ocorrencia` (`id_ocorrencia`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ocorrencia_anexo`
--

LOCK TABLES `ocorrencia_anexo` WRITE;
/*!40000 ALTER TABLE `ocorrencia_anexo` DISABLE KEYS */;
/*!40000 ALTER TABLE `ocorrencia_anexo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pdi`
--

DROP TABLE IF EXISTS `pdi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pdi` (
  `id_pdi` int NOT NULL AUTO_INCREMENT,
  `id_colaborador` int NOT NULL,
  `objetivo` varchar(255) NOT NULL,
  `acao` text NOT NULL,
  `prazo` date NOT NULL,
  `responsavel` varchar(255) DEFAULT NULL,
  `status` enum('Em Andamento','Concluído','Cancelado') DEFAULT 'Em Andamento',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pdi`),
  KEY `id_colaborador` (`id_colaborador`),
  CONSTRAINT `pdi_ibfk_1` FOREIGN KEY (`id_colaborador`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pdi`
--

LOCK TABLES `pdi` WRITE;
/*!40000 ALTER TABLE `pdi` DISABLE KEYS */;
/*!40000 ALTER TABLE `pdi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treinamento`
--

DROP TABLE IF EXISTS `treinamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treinamento` (
  `id_treinamento` int NOT NULL AUTO_INCREMENT,
  `id_colaborador` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `categoria` enum('Online','Presencial') NOT NULL,
  `carga_horaria` int DEFAULT NULL,
  `observacoes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_treinamento`),
  KEY `id_colaborador` (`id_colaborador`),
  CONSTRAINT `treinamento_ibfk_1` FOREIGN KEY (`id_colaborador`) REFERENCES `colaborador` (`id_colaborador`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treinamento`
--

LOCK TABLES `treinamento` WRITE;
/*!40000 ALTER TABLE `treinamento` DISABLE KEYS */;
/*!40000 ALTER TABLE `treinamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treinamento_anexo`
--

DROP TABLE IF EXISTS `treinamento_anexo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treinamento_anexo` (
  `id_anexo` int NOT NULL AUTO_INCREMENT,
  `id_treinamento` int NOT NULL,
  `url` varchar(1024) NOT NULL,
  `nome_arquivo` varchar(512) NOT NULL,
  `content_type` varchar(128) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_anexo`),
  KEY `idx_treinamento_anexo_treinamento` (`id_treinamento`),
  KEY `idx_treinamento_anexo_url` (`url`(255)),
  CONSTRAINT `treinamento_anexo_ibfk_1` FOREIGN KEY (`id_treinamento`) REFERENCES `treinamento` (`id_treinamento`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treinamento_anexo`
--

LOCK TABLES `treinamento_anexo` WRITE;
/*!40000 ALTER TABLE `treinamento_anexo` DISABLE KEYS */;
/*!40000 ALTER TABLE `treinamento_anexo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `id_empresa` int DEFAULT NULL,
  `id_colaborador` int DEFAULT NULL,
  `nome` varchar(45) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo_usuario` enum('consultoria','empresa','colaborador') NOT NULL,
  `id_referencia` int NOT NULL,
  `status` enum('Ativo','Inativo') DEFAULT 'Ativo',
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `tentativas_login` int DEFAULT '0',
  `bloqueado_ate` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_tipo_referencia` (`tipo_usuario`,`id_referencia`),
  KEY `idx_status` (`status`),
  KEY `id_referenciaXid_empresa_idx` (`id_referencia`),
  KEY `idx_usuario_id_empresa` (`id_empresa`),
  KEY `fk_usuario_colaborador` (`id_colaborador`),
  CONSTRAINT `fk_usuario_colaborador` FOREIGN KEY (`id_colaborador`) REFERENCES `colaborador` (`id_colaborador`),
  CONSTRAINT `fk_usuario_empresa` FOREIGN KEY (`id_empresa`) REFERENCES `empresa` (`id_empresa`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (10,8,NULL,'USer Company','admin@admin2.com','$2a$12$LBO./gb4nzr6dcvCZyjeJeW.kzZcLY23ZyjolCz6VWYQon7G7qqUO','empresa',8,'Ativo','2025-10-27 13:21:21',0,NULL,'2025-10-21 20:39:08','2025-10-27 13:21:21'),(11,NULL,NULL,'Paulo Roggê','paulorogge@paulorogge.com.br','$2a$12$XZM1Z2byNkxCJWwBB1CAue2sO2vAKGch/xJXe.OemPz6RmqOOyDmq','consultoria',2,'Ativo','2025-10-30 00:29:04',0,NULL,'2025-10-23 00:24:01','2025-10-30 00:29:04'),(20,NULL,NULL,'Harim Francisco','harimfrancisco@ladhe.com.br','$2a$12$2qssNpSXxbIzqKQUUl56ieKHCTHA4Oz9P4XH2WAdyjW7JnDMUNDUC','consultoria',2,'Ativo','2025-10-30 13:27:08',0,NULL,'2025-10-30 00:26:37','2025-10-30 13:27:08'),(21,NULL,NULL,'Lorena Azevedo','lorenaazevedo@ladhe.com.br','$2a$12$pQr6lWa2rbxKAmH3HFUnRuHnIow4G70Lw2AdkifoGSBdbU8JRxA1W','consultoria',2,'Ativo',NULL,0,NULL,'2025-10-30 00:27:01','2025-10-30 00:27:01');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-30 10:34:37
