import { PrismaClient, User } from '@prisma/client';
import schedule from 'node-schedule';
import { AchievementUtil } from '../utils/AchievementUtil';
import RedisClient from '../utils/RedisClient';

const prisma = new PrismaClient();
const redis = RedisClient.getInstance();
const expire = 30 * 60; // 30분

// Redis에 랭킹 데이터 저장
const redisUpsert = async (user: User, achievement: number) => {
  const { userId, name, exp } = user;
  await redis.zadd('user:score', exp, `user:${userId}`);
  await redis.expire('user:score', expire);

  const userInfo = { name, exp, achievement };
  await redis.hmset(`user:${userId}`, userInfo);
  await redis.expire(`user:${userId}`, expire);
};

// 랭킹 upsert 메서드
const upsertRanking = async (user: User) => {
  const habits = await prisma.habit.findMany({
    where: { userId: user.userId },
    include: { commitHistory: true },
  });

  let achievement = 0;
  if (habits.length > 0) {
    habits.forEach(habit => {
      const newHabit: any = AchievementUtil.calulateAchievement(habit);
      achievement += newHabit.percent;
    });

    achievement = Math.round(achievement / habits.length);
  }

  await redisUpsert(user, achievement);
};

const scheduler = {
  // 1시간 마다 모든 사용자의 경험치를 조회한 후 Ranking 테이블 갱신
  RankingUpdateJob: () => {
    console.log('랭킹 업데이트 스케줄러 설정 완료 :)');

    schedule.scheduleJob('*/2 * * * *', async () => {
      console.log('랭킹 업데이트 시작 !');
      try {
        const users = await prisma.user.findMany();
        if (users.length === 0) throw new Error('랭킹 업데이트: 업데이트 할 사용자가 없습니다.');

        for (const user of users) await upsertRanking(user);
      } catch (err) {
        throw new Error(err.message);
      }
      console.log('랭킹 업데이트 종료 :)');
    });
  },
};

export default scheduler;
