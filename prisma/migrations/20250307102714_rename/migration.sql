/*
  Warnings:

  - You are about to drop the `resetpasswordtoken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `resetpasswordtoken`;

-- CreateTable
CREATE TABLE `reset_password_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reset_password_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
