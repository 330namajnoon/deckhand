-- CreateTable
CREATE TABLE `deploys` (
    `id` VARCHAR(191) NOT NULL,
    `branchName` VARCHAR(191) NOT NULL,
    `projectId` INTEGER NULL,
    `projectName` VARCHAR(191) NOT NULL,
    `ref` VARCHAR(191) NOT NULL,
    `type` ENUM('entorno', 'test') NULL,
    `entornoUrl` TEXT NULL,
    `messenger` BOOLEAN NULL,
    `status` ENUM('creando', 'instalando', 'listo', 'error') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `fechaCaducidad` VARCHAR(191) NULL,
    `usuarioSsh` VARCHAR(191) NULL,
    `contrasenaSsh` VARCHAR(191) NULL,
    `servidorSsh` VARCHAR(191) NULL,
    `puertoSsh` VARCHAR(191) NULL,
    `cadenaConexionSsh` TEXT NULL,
    `rutaRaiz` TEXT NULL,
    `url` TEXT NULL,
    `ideKeyXdebug` VARCHAR(191) NULL,
    `entornoName` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `project` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

