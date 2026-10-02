-- Add imageUrl to Book
ALTER TABLE "books" ADD COLUMN "imageUrl" TEXT;

-- Add pickupDate to BookRental
ALTER TABLE "book_rentals" ADD COLUMN "pickupDate" TIMESTAMP(3);

-- Create InviteToken table
CREATE TABLE "invite_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL UNIQUE,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL
);
