import { Habit, HabitCreateInput, HabitUpdateInput, SchedulerCreateInput, User } from '@prisma/client';
import { Response } from 'express';
import moment from 'moment';
import { HttpError } from 'routing-controllers';
import { ForbiddenError, InternalServerError, NotFoundError } from '../exceptions/Exception';
import { CommitRepository } from '../repository/CommitRepository';
import { HabitRepository } from '../repository/HabitRepository';
import RedisRepository from '../repository/RedisRepository';
import { SchedulerRepository } from '../repository/SchedulerRepository';
import { AchievementUtil } from '../utils/AchievementUtil';
import { CommentUtil } from '../utils/CommentUtil';
import { ItemUtil } from '../utils/ItemUtil';
import { LevelUtil } from '../utils/LevelUtil';
import { CreateHabitRequestDto, GetHabitRequestDto, HabitID, UpdateHabitRequestDto } from '../validations/HabitValidation';
import { BaseService } from './BaseService';
import { errorService } from './LogService';
require('moment-timezone');

export class HabitService extends BaseService {
  private habitRepository: HabitRepository;
  private schedulerRepository: SchedulerRepository;
  private commitRepository: CommitRepository;
  private redis: RedisRepository;
  private achievementUtil: AchievementUtil;
  private commentUtil: any;
  private levelUtil: any;
  private itemUtil: any;

  constructor() {
    super();
    moment.tz.setDefault('Asia/Seoul');
    this.habitRepository = new HabitRepository();
    this.schedulerRepository = new SchedulerRepository();
    this.commitRepository = new CommitRepository();
    this.redis = new RedisRepository();
    this.achievementUtil = new AchievementUtil();
    this.commentUtil = new CommentUtil();
    this.levelUtil = new LevelUtil();
    this.itemUtil = new ItemUtil();
  }

  // 습관 생성
  public async createHabit(user: User, habitDto: CreateHabitRequestDto) {
    try {
      const habitPayload: HabitCreateInput = habitDto.toEntity(user);
      const newHabit = await this.habitRepository.create(habitPayload);

      // 스케줄러 등록 부분(추가 수정 필요)
      if (habitPayload.alarmTime === null) return newHabit;

      const schedulerPayload: SchedulerCreateInput = {
        userId: user.userId,
        habitId: newHabit.habitId,
      };
      await this.schedulerRepository.create(schedulerPayload);
      await this.addHabitInRedis(newHabit, user);

      return newHabit;
    } catch (err) {
      errorService(err);
      if (err instanceof HttpError) throw err;
      throw new InternalServerError(err.message);
    }
  }

  // 일주일 이내 커밋했던 모든 습관 가져오기
  public async findAllHabitWithComment(user: User) {
    try {
      let todayDoneHabit = 0;
      let todayHabit = 0;

      let habits = await this.habitRepository.findAllByUserId(user.userId);
      habits = await Promise.all(
        habits.map(habit => this.achievementUtil.calulateAchievement(habit))
      )
      habits.forEach(habit => {
        habit.commitHistory = habit.commitHistory.filter(history => {
          const date = moment(history.createdAt)
          const start = moment().startOf('weeks').toDate();
          const end = moment().endOf('weeks').toDate();
          return date.isBetween(start, end)
        })

        if (habit.dayOfWeek[moment().day()] === '1') {
          if (habit.commitHistory.length) {
            if (moment(habit.commitHistory[habit.commitHistory.length - 1].createdAt).format('yyyy-MM-DD') === moment().format('yyyy-MM-DD'))
              todayDoneHabit++;
          }
          todayHabit++;
        }
      })
      
      const comment = this.commentUtil.selectComment(todayHabit, todayDoneHabit);

      return { habits, comment };
    } catch (err) {
      errorService(err);
      if (err instanceof HttpError) throw err;
      throw new InternalServerError(err.message);
    }
  }

  // habitId로 특정 습관 조회하기
  public async findHabitWithCommitCount(user: User, habitDto: GetHabitRequestDto) {
    try {
      const year = parseInt(moment().format('YYYY')) - habitDto.year;
      const month = parseInt(moment().format('MM')) - habitDto.month;

      let habit = await this.habitRepository.findByIdWithinYearAndMonth(habitDto.habitId, year, month);
      if (habit === null) throw new NotFoundError('습관을 찾을 수 없습니다.');

      if (habit.userId === user.userId) {
        if (habit.commitHistory.length) {
          if (
            moment(habit.commitHistory[habit.commitHistory.length - 1].createdAt, 'yyyy-MM-DDTHH-mm-ss.SSSZ').startOf('days') <
            moment().subtract(1, 'days').startOf('days')
          ) {
            habit = await this.habitRepository.updateByIdWithinYearAndMonth(habitDto.habitId, year, month);
          }
        }
        const commitFullCount = await this.commitRepository.count(habit.habitId);

        const lastMonth = await this.commitRepository.countWithinLastMonth(habit.habitId, year, month);

        return {
          habit,
          commitFullCount,
          lastMonth,
        };
      }
      throw new ForbiddenError('잘못된 접근입니다.');
    } catch (err) {
      errorService(err);
      if (err instanceof HttpError) throw err;
      throw new InternalServerError(err.message);
    }
  }

  // 습관 업데이트
  public async updateHabit(user: User, id: HabitID, habitDto: UpdateHabitRequestDto) {
    try {
      const findHabit = await this.habitRepository.findById(id.habitId);
      if (findHabit === null) throw new NotFoundError('습관을 찾을 수 없습니다.');

      if (findHabit.userId === user.userId) {
        const habitPayload: HabitUpdateInput = habitDto.toEntity(user);
        const updateHabit = await this.habitRepository.updateById(id.habitId, habitPayload);

        // 스케줄러 편집
        await this.deleteHabitInRedis(findHabit);

        if (habitPayload.alarmTime === null) {
          if (findHabit.alarmTime) await this.schedulerRepository.deleteByHabitId(updateHabit.habitId);
          return updateHabit;
        }
        await this.schedulerRepository.upsert(user.userId, updateHabit.habitId, findHabit.habitId);
        await this.addHabitInRedis(updateHabit, user);
        return updateHabit;
      }
      throw new ForbiddenError('잘못된 접근입니다.');
    } catch (err) {
      errorService(err);
      if (err instanceof HttpError) throw err;
      throw new InternalServerError(err.message);
    }
  }

  // 습관 삭제 (연관 엔티티 모두 삭제)
  public async deleteHabit(user: User, id: HabitID) {
    try {
      const findHabit = await this.habitRepository.findById(id.habitId);
      if (findHabit === null) throw new NotFoundError('습관을 찾을 수 없습니다.');

      if (findHabit.userId === user.userId) {
        await this.commitRepository.deleteAllByHabitId(id.habitId);
        await this.schedulerRepository.deleteAllByHabitId(id.habitId);
        await this.habitRepository.deleteById(id.habitId);

        // 레디스에서 삭제
        // 레디스에는 앞으로의 습관 계획이 적혀있기 때문에 이를 고려해야합니다.
        await this.deleteHabitInRedis(findHabit);
        // Success
        return;
      }
      throw new ForbiddenError('잘못된 접근입니다.');
    } catch (err) {
      errorService(err);
      if (err instanceof HttpError) throw err;
      throw new InternalServerError(err.message);
    }
  }

  // 습관 커밋하기 (오늘 해야할 습관을 체크)
  public async commitHabit(user: User, id: HabitID, res: Response) {
    try {
      const findHabitForDay = await this.habitRepository.findById(id.habitId);
      if (findHabitForDay === null) throw new NotFoundError('습관을 찾을 수 없습니다.');

      let check = 0;
      const todayOfTheWeek = moment().day();
      for (let i = todayOfTheWeek + 6; i !== todayOfTheWeek; --i) {
        check++;
        if (i > 6) {
          if (findHabitForDay.dayOfWeek[i - 7] === '1') break;
        } else {
          if (findHabitForDay.dayOfWeek[i] === '1') break;
        }
      }
      const findHabit = await this.habitRepository.findForTemp(id.habitId, check);
      if (findHabit === null) throw new NotFoundError('습관을 찾을 수 없습니다.');

      let updateHabit;
      if (findHabit.userId === user.userId) {
        if (findHabit.commitHistory.length) {
          if (moment(findHabit.commitHistory[findHabit.commitHistory.length - 1].createdAt).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD'))
            return res.status(303).send({});
          updateHabit = await this.habitRepository.updateCountAndUserExp(id.habitId, findHabit.continuousCount + 1, user.exp);
        } else updateHabit = await this.habitRepository.updateCountAndUserExp(id.habitId, 1, user.exp);

        const isEqual = this.levelUtil.compareLevels(user.exp, updateHabit.user.exp);
        if (!isEqual) return this.itemUtil.createItem(user);
        return {};
      }
      throw new ForbiddenError('잘못된 접근입니다.');
    } catch (err) {
      errorService(err);
      if (err instanceof HttpError) throw err;
      throw new InternalServerError(err.message);
    }
  }

  // Redis 추가 or 업데이트 작업
  private async addOrUpdateRedis(alarmTime: string, user: User, habit: Habit) {
    console.log(alarmTime);
    await this.redis.sadd(alarmTime, String(habit.habitId));
    await this.redis.hmset(`habitId:${habit.habitId}`, ['user', user.userId, 'title', habit.title, 'dayOfWeek', habit.dayOfWeek]);
    await this.redis.expire(`habitId:${habit.habitId}`, 604860);
  }

  // 다음에 습관을 해야 하는 날짜 계산
  private calculateAlarmDay(habit: Habit) {
    const checkIndexOfNextDay = (todayIndex: number, dayOfWeek: string) => {
      let indexOfNextDay = todayIndex + 1;
      if (indexOfNextDay === 7) indexOfNextDay = 0;
      while (dayOfWeek[indexOfNextDay] !== '1') {
        indexOfNextDay++;
        if (indexOfNextDay === 7) indexOfNextDay = 0;
      }
      return indexOfNextDay;
    };
    const indexOfNextDay = checkIndexOfNextDay(moment().day(), habit.dayOfWeek);
    let dateToAdd;
    if (indexOfNextDay <= moment().day()) dateToAdd = 7 - moment().day() + indexOfNextDay;
    else dateToAdd = indexOfNextDay - moment().day();

    return dateToAdd;
  }

  // redis에서 습관 삭제
  private async deleteHabitInRedis(habit: Habit) {
    if(habit.dayOfWeek[moment().day()] === '1'){
      if(moment(habit.alarmTime, 'HH:mm').isAfter(moment().minutes())){
        await this.redis.srem(moment(habit.alarmTime, 'HH:mm').format('MMDDHHmm'), String(habit.habitId));
      }
    } else {
      const dateToAdd = this.calculateAlarmDay(habit);
      await this.redis.srem(moment().add(dateToAdd, 'days').format('MMDDHHmm'), String(habit.habitId));
    }
  }

  // redis에 습관 추가
  private async addHabitInRedis(habit: Habit, user: User) {
    if (habit.dayOfWeek[moment().day()] === '1') {
      const time = moment().startOf('minutes');
      const alarmTime = moment(habit.alarmTime, 'HH:mm');
      if (time.isBefore(alarmTime)) await this.addOrUpdateRedis(alarmTime.format('MMDDHHmm'), user, habit);
      else {
        const dateToAdd = this.calculateAlarmDay(habit);
        const alarmTime = moment(habit.alarmTime, 'HH:mm').add(dateToAdd, 'days');
        await this.addOrUpdateRedis(alarmTime.format('MMDDHHmm'), user, habit);
      }
    } else {
      const dateToAdd = this.calculateAlarmDay(habit);
      const alarmTime = moment(habit.alarmTime, 'HH:mm').add(dateToAdd, 'days');
      await this.addOrUpdateRedis(alarmTime.format('MMDDHHmm'), user, habit);
    }
  }
}
