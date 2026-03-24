// src/lib/prisma.js

// PrismaClient, Prisma'nın veritabanı ile konuşmak için sağladığı ana sınıftır.
const { PrismaClient } = require('@prisma/client');

// Tek bir PrismaClient instance'ı oluşturuyoruz.
// Uygulama boyunca bu instance'ı kullanacağız.
const prisma = new PrismaClient();

// Diğer dosyalarda kullanabilmek için export ediyoruz.
module.exports = prisma;
