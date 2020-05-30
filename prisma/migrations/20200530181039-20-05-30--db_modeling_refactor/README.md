# Migration `20200530181039-20-05-30--db_modeling_refactor`

This migration has been generated by dnatuna at 5/30/2020, 6:10:39 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
DROP INDEX `users.email` ON `habit_bread`.`users`

ALTER TABLE `habit_bread`.`habits` DROP COLUMN `description`,
ADD COLUMN `countinuous_count` int NOT NULL  ,
ADD COLUMN `day_of_week` varchar(191) NOT NULL  ;

ALTER TABLE `habit_bread`.`items` DROP FOREIGN KEY `items_ibfk_1`,
DROP COLUMN `userUserId`,
ADD COLUMN `img` varchar(191) NOT NULL  ;

ALTER TABLE `habit_bread`.`ranking` DROP COLUMN `persent`,
ADD COLUMN `achievement` int NOT NULL  ;

ALTER TABLE `habit_bread`.`scheduler` DROP COLUMN `habit_alarm_at`,
DROP COLUMN `habit_title`,
DROP COLUMN `habit_type`,
DROP COLUMN `habit_id`,
ADD COLUMN `habit_id` int NOT NULL  ;

ALTER TABLE `habit_bread`.`users` DROP COLUMN `email`,
DROP COLUMN `image_url`,
ADD COLUMN `fcmToken` varchar(191)   ,
DROP COLUMN `name`,
ADD COLUMN `name` varchar(191)   ;
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200528105346-20-05-28--db_modeling_refactor..20200530181039-20-05-30--db_modeling_refactor
--- datamodel.dml
+++ datamodel.dml
@@ -3,41 +3,39 @@
 }
 datasource mysql {
   provider = "mysql"
-  url = "***"
+  url      = env("DB_URL")
 }
 model Ranking {
   rankingId     Int       @id      @map("ranking_id")
-  userId        Int    @map("user_id")
+  userId        Int       @map("user_id")
   userName      String    @map("user_name")
   exp           Int
-  persent       Int
+  achievement   Int
   @@map("ranking")
 }
 model Scheduler {
-  scheduleId    Int       @id @map("schedule_id")
-  userId        Int    @map("user_id")
-  habitId       String    @map("habit_id")
-  habitTitle    String    @map("habit_title")
-  habitAlarmAt  DateTime  @map("habit_alarm_at")
-  habitType     Int       @map("habit_type")
+  scheduleId     Int       @id @map("schedule_id")
+  userId         Int       @map("user_id")
+  habitId        Int       @map("habit_id")
   @@map("scheduler")
 }
 model Habit {
-  habitId       Int       @default(autoincrement()) @id @map("habit_id")
-  userId        Int    @map("user_id")
-  title         String
-  description   String?
-  category      String
+  habitId         Int       @default(autoincrement()) @id @map("habit_id")
+  userId          Int       @map("user_id")
+  title           String
+  category        String
+  dayOfWeek       String    @map("day_of_week")
+  continuousCount Int       @map("countinuous_count")
-  commitHistory CommitHistory[]
-  user          User      @relation(fields: [userId], references: [userId])
+  commitHistory   CommitHistory[]
+  user            User      @relation(fields: [userId], references: [userId])
   @@index([userId], name: "fk_Habit_User1_idx")
   @@map("habits")
 }
@@ -51,31 +49,30 @@
   @@index([habitId], name: "fk_Habit_History_Habit1_idx")
   @@map("commit_history")
 }
-
 model User {
-  userId        Int    @default(autoincrement()) @id @map("user_id")
-  name          String
-  email         String    @unique
+  userId        Int       @default(autoincrement()) @id @map("user_id")
+  name          String?
   exp           Int       @default(0)
-  imageUrl      String?   @map("image_url")
   createdAt     DateTime? @map("created_at") @default(now())
   updatedAt     DateTime? @map("updated_at") @updatedAt
   oauthKey      String    @map("oauth_key") @unique
+  fcmToken      String?
-  items         Item[]
+  items         UserItem[]
   habits        Habit[]
   @@map("users")
 }
 model UserItem {
   itemId      Int       @map("item_id")
-  userId      Int    @map("user_id")
+  userId      Int       @map("user_id")
+  createdAt   DateTime  @default(now())
+
   item        Item      @relation(fields: [itemId], references: [itemId])
   user        User      @relation(fields: [userId], references: [userId])
-  createdAt   DateTime  @default(now())
   @@id([itemId, userId])
   @@map("user_item")
 }
@@ -84,7 +81,8 @@
   itemId        Int       @default(autoincrement()) @id @map("item_id")
   name          String
   description   String
   level         Int
+  img           String
   @@map("items")
 }
```

