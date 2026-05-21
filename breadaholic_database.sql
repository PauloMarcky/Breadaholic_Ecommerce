-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: breadaholic_database
-- ------------------------------------------------------
-- Server version	8.0.45

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
-- Table structure for table `cart_item`
--

DROP TABLE IF EXISTS `cart_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_item` (
  `ordItem_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`ordItem_id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_item_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `cart_item_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_item`
--

LOCK TABLES `cart_item` WRITE;
/*!40000 ALTER TABLE `cart_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `rev_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `message` text,
  `rating` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rev_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `ord_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`ord_id`),
  KEY `idx_order_items_product_id` (`product_id`),
  KEY `idx_order_items_order_id` (`order_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (18,16,78,1,85.00),(19,17,79,2,140.00),(20,18,91,10,220.00),(21,19,93,10,440.00),(22,20,93,10,440.00),(23,21,94,1,350.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `barangay` varchar(255) DEFAULT NULL,
  `street_name` varchar(255) DEFAULT NULL,
  `house_num` varchar(50) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `order_total` decimal(10,2) DEFAULT NULL,
  `shipping_fee` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `date_ordered` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_orders_created_at` (`date_ordered`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (16,2,'Patul','purok 1','AB1245','idk',155.00,70.00,'Completed','2026-05-21 15:20:32'),(17,2,'Patul','purok 1','AB1245','idk',350.00,70.00,'Completed','2026-05-21 15:21:18'),(18,2,'Patul','purok 1','AB1245','idk',2270.00,70.00,'Preparing','2026-05-21 15:49:16'),(19,2,'Patul','purok 1','AB1245','idk',4470.00,70.00,'Canceled','2026-05-21 15:51:19'),(20,2,'Sinsayon','Purok 2','123abd','',4470.00,70.00,'Completed','2026-05-21 15:52:57'),(21,2,'Sinsayon','Purok 2','123abd','',420.00,70.00,'Completed','2026-05-21 15:53:44');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(99) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `stock` int DEFAULT NULL,
  `image` varchar(99) DEFAULT NULL,
  `ingredients` text,
  `featured` tinyint(1) DEFAULT NULL,
  `last_update` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (78,'Americano','Coffee',85.00,10,'/product_images/product_78.png','coffee, sugar',NULL,'2026-05-21 14:28:56'),(79,'Lotus Biscoff Espresso','Coffee',140.00,10,'/product_images/product_79.png','',1,'2026-05-21 14:31:55'),(80,'Black Forest Espresso','Coffee',120.00,10,'/product_images/product_80.png','',1,'2026-05-21 14:32:17'),(81,'Caramel Macchiato ','Coffee',120.00,10,'/product_images/product_81.png','',NULL,'2026-05-21 14:32:51'),(82,'Dark Mocha Hazelnut','Coffee',120.00,10,'/product_images/product_82.png','',NULL,'2026-05-21 14:33:25'),(83,'Peanut Butter Espresso','Coffee',120.00,10,'/product_images/product_83.png','',NULL,'2026-05-21 14:33:46'),(84,'Spanish Latte','Coffee',115.00,10,'/product_images/product_84.png','',NULL,'2026-05-21 14:34:16'),(85,'Ube Espresso','Coffee',120.00,10,'/product_images/product_85.png','',NULL,'2026-05-21 14:34:32'),(86,'Vanilla Latte','Coffee',115.00,10,'/product_images/product_86.png','',NULL,'2026-05-21 14:34:54'),(87,'Matcha Latte','Tea',125.00,10,'/product_images/product_87.png','',1,'2026-05-21 14:35:21'),(88,'Milk Strawberry','Tea',110.00,10,'/product_images/product_88.png','',NULL,'2026-05-21 14:35:37'),(89,'Chocoberry','Tea',110.00,10,'/product_images/product_89.png','',NULL,'2026-05-21 14:36:00'),(90,'Milk Chocolate','Tea',110.00,10,'/product_images/product_90.png','',1,'2026-05-21 14:36:16'),(91,'Assorted Classic Cinnamon 3pcs','Bread',220.00,0,'/product_images/product_91.png','',NULL,'2026-05-21 14:38:33'),(92,'Classic Cinnamon Roll 1pc','Bread',60.00,10,'/product_images/product_92.jpg','flour, sugar, butter',1,'2026-05-21 14:39:07'),(93,'Assorted Classic Cinnamon 6pcs','Bread',440.00,0,'/product_images/product_93.png','',1,'2026-05-21 14:39:34'),(94,'Classic Cinnamon 6pcs','Bread',350.00,9,'/product_images/product_94.png','',NULL,'2026-05-21 14:40:17'),(96,'Classic Cinnamon Roll 3pcs','Bread',175.00,10,'/product_images/product_96.jpg','',NULL,'2026-05-21 14:44:33');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_price_list`
--

DROP TABLE IF EXISTS `shipping_price_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_price_list` (
  `rate_id` int NOT NULL AUTO_INCREMENT,
  `barangay_name` varchar(255) DEFAULT NULL,
  `shipping_fee` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`rate_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_price_list`
--

LOCK TABLES `shipping_price_list` WRITE;
/*!40000 ALTER TABLE `shipping_price_list` DISABLE KEYS */;
INSERT INTO `shipping_price_list` VALUES (1,'Dubinan East',50.00),(2,'Victory Norte',50.00),(3,'Victory Sur',50.00),(4,'Plaridel',50.00),(5,'Rosario',60.00),(6,'Villasis',50.00),(7,'Calaocan',70.00),(8,'Calao West',60.00),(9,'Calao East',60.00),(10,'Sinsayon',70.00),(11,'Patul',70.00);
/*!40000 ALTER TABLE `shipping_price_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `mobile_number` varchar(11) DEFAULT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `barangay` varchar(50) DEFAULT NULL,
  `street_name` varchar(50) DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `profile_picture` varchar(200) DEFAULT '/default-pfp.png',
  `date_joined` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(10) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `barangay_second` varchar(99) DEFAULT NULL,
  `barangay_third` varchar(99) DEFAULT NULL,
  `street_name_second` varchar(99) DEFAULT NULL,
  `street_name_third` varchar(99) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `landmark_second` varchar(255) DEFAULT NULL,
  `landmark_third` varchar(255) DEFAULT NULL,
  `house_num` varchar(10) DEFAULT NULL,
  `house_num_second` varchar(10) DEFAULT NULL,
  `house_num_third` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `mobile_number` (`mobile_number`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'09489928125','Marcky','Balaba','Sinsayon','Purok 2','user','/pfp\'s/user_2.png','2026-05-20 15:37:25','active','user','Patul',NULL,'purok 1',NULL,'','idk',NULL,'123abd','AB1245',NULL),(3,'09397708759','admin','role','Calaocan','idk','admin',NULL,'2026-05-20 15:44:22','active','admin',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21 22:17:09
