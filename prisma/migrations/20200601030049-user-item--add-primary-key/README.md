# Migration `20200601030049-user-item--add-primary-key`

This migration has been generated by wwlee94 at 6/1/2020, 3:00:49 AM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
ALTER TABLE `habit_bread`.`user_item` ADD COLUMN `user_item_id` int NOT NULL  AUTO_INCREMENT;
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200530181039-20-05-30--db_modeling_refactor..20200601030049-user-item--add-primary-key
--- datamodel.dml
+++ datamodel.dml
@@ -3,9 +3,9 @@
 }
 datasource mysql {
   provider = "mysql"
-  url = "***"
+  url      = env("DB_URL")
 }
 model Ranking {
   rankingId     Int       @id      @map("ranking_id")
@@ -65,16 +65,16 @@
   @@map("users")
 }
 model UserItem {
+  userItemId  Int       @default(autoincrement()) @id @map("user_item_id")
   itemId      Int       @map("item_id")
   userId      Int       @map("user_id")
   createdAt   DateTime  @default(now())
   item        Item      @relation(fields: [itemId], references: [itemId])
   user        User      @relation(fields: [userId], references: [userId])
-  @@id([itemId, userId])
   @@map("user_item")
 }
 model Item {
```

