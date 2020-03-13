CREATE TABLE IF NOT EXISTS `folders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int(10) unsigned NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `count` int(10) unsigned DEFAULT '0',
  `sync_status` ENUM('not_synced','syncing', 'syncing_need_resync','synced','synced') NOT NULL DEFAULT 'not_synced',
  `sync_host` VARCHAR(100) NULL,
  `sync_pid` INT NULL,
  `synced` int(10) unsigned DEFAULT '0',
  `uid_validity` int(10) unsigned DEFAULT '0',
  `deleted` tinyint(1) unsigned DEFAULT '0',
  `ignored` tinyint(1) unsigned DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `synced_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE( `account_id`, `name` )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
