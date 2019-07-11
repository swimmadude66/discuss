CREATE DATABASE IF NOT EXISTS `discuss` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;

USE `discuss`;

CREATE TABLE IF NOT EXISTS `users` (
  `RowId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` varchar(64) NOT NULL,
  `Email` varchar(128) NOT NULL,
  `PasswordHash` text NOT NULL,
  `PasswordAlgorithm` enum('sha256','sha512','argon2') NOT NULL DEFAULT 'argon2',
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  `CreateDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ModifiedDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`UserId`),
  UNIQUE KEY `UserRowId_UNIQUE` (`RowId`),
  UNIQUE KEY `UserId_UNIQUE` (`UserId`),
  UNIQUE KEY `Email_UNIQUE` (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sessions` (
  `RowId` int(11) NOT NULL AUTO_INCREMENT,
  `SessionKey` varchar(64) NOT NULL,
  `UserId` varchar(64) NOT NULL,
  `Expires` bigint(20) NOT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  `Created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `LastUsed` bigint(20) NOT NULL,
  `UserAgent` text,
  PRIMARY KEY (`SessionKey`),
  UNIQUE KEY `SessionRowId_UNIQUE` (`RowId`),
  UNIQUE KEY `SessionKey_UNIQUE` (`SessionKey`),
  KEY `session_user_idx` (`UserId`),
  CONSTRAINT `session_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `posts` (
  `RowId` int(11) NOT NULL AUTO_INCREMENT,
  `PostId` varchar(64) NOT NULL,
  `PosterId` varchar(64) NOT NULL,
  `ParentId` varchar(64) DEFAULT NULL,
  `Title` varchar(256) NOT NULL,
  `PostDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Body` longtext,
  `RootId` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`PostId`),
  UNIQUE KEY `PostId_UNIQUE` (`PostId`),
  UNIQUE KEY `PostRowId_UNIQUE` (`RowId`),
  KEY `postParent_idx` (`ParentId`),
  KEY `postPoster_idx` (`PosterId`),
  CONSTRAINT `postPoster` FOREIGN KEY (`PosterId`) REFERENCES `users` (`UserId`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `post_votes` (
  `RowId` int(11) NOT NULL AUTO_INCREMENT,
  `PostId` varchar(64) NOT NULL,
  `VoterId` varchar(64) NOT NULL,
  `Score` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`RowId`),
  UNIQUE KEY `VoteRowId_UNIQUE` (`RowId`),
  UNIQUE KEY `post_user_vote` (`PostId`,`VoterId`),
  KEY `voter_idx` (`VoterId`),
  KEY `votedPost_idx` (`PostId`),
  CONSTRAINT `votedPost` FOREIGN KEY (`PostId`) REFERENCES `posts` (`PostId`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `voter` FOREIGN KEY (`VoterId`) REFERENCES `users` (`UserId`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `discuss`.`postscore` AS
    SELECT 
        `discuss`.`post_votes`.`PostId` AS `PostId`,
        SUM(`discuss`.`post_votes`.`Score`) AS `Score`
    FROM
        `discuss`.`post_votes`
    GROUP BY `discuss`.`post_votes`.`PostId`;

CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `discuss`.`postrank` AS
    SELECT 
        `p`.`PostId` AS `PostId`,
        `ps`.`Score` AS `Score`,
        (FLOOR((TIMEDIFF(`p`.`PostDate`, NOW()) / 300)) + `ps`.`Score`) AS `Rank`
    FROM
        (`discuss`.`posts` `p`
        JOIN `discuss`.`postscore` `ps` ON ((`p`.`PostId` = `ps`.`PostId`)))
    GROUP BY `p`.`PostId`
    ORDER BY `Rank` DESC, `ps`.`Score` DESC;
